<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');
$user = current_user();
if (!$user) { http_response_code(401); die(json_encode(['error'=>'Please sign in to open product messages.'])); }
if (!in_array($user['role'],['user','owner'],true)) { http_response_code(403); die(json_encode(['error'=>'Account access only.'])); }
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $conversationId = (int)($_GET['id'] ?? 0);
    $owner = $user['role'] === 'owner';
    $readColumn = $owner ? 'owner_read_at' : 'user_read_at';
    if ($conversationId) {
        $sql = "SELECT c.id,c.user_id,c.product_id,c.feedback_id,c.kind,c.status,c.preorder_qty,c.created_at,c.updated_at,p.name product_name,p.price,p.stock,u.name customer_name,f.rating feedback_rating
                FROM product_conversations c JOIN products p ON p.id=c.product_id JOIN users u ON u.id=c.user_id
                LEFT JOIN product_feedback f ON f.id=c.feedback_id
                WHERE c.id=?".($owner ? '' : ' AND c.user_id=?');
        $stmt = $pdo->prepare($sql);
        $stmt->execute($owner ? [$conversationId] : [$conversationId,$user['id']]);
        $conversation = $stmt->fetch();
        if (!$conversation) { http_response_code(404); die(json_encode(['error'=>'Conversation not found.'])); }
        $pdo->prepare("UPDATE product_conversations SET $readColumn=NOW() WHERE id=?")->execute([$conversationId]);
        $stmt = $pdo->prepare("SELECT m.id,m.sender_role,m.message,m.created_at,CASE WHEN m.sender_role='owner' THEN o.name WHEN m.sender_role='user' THEN u.name ELSE 'PawCare' END sender_name
                               FROM product_messages m LEFT JOIN owners o ON m.sender_role='owner' AND o.id=m.sender_id
                               LEFT JOIN users u ON m.sender_role='user' AND u.id=m.sender_id
                               WHERE m.conversation_id=? ORDER BY m.created_at,m.id");
        $stmt->execute([$conversationId]);
        echo json_encode(['conversation'=>$conversation,'messages'=>$stmt->fetchAll(),'role'=>$user['role']]); exit;
    }

    $filter = $owner ? '' : 'WHERE c.user_id=?';
    $sql = "SELECT c.id,c.user_id,c.feedback_id,c.product_id,c.kind,c.status,c.preorder_qty,c.updated_at,p.name product_name,u.name customer_name,f.rating feedback_rating,
                   (SELECT m.message FROM product_messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC,m.id DESC LIMIT 1) last_message,
                   (SELECT m.created_at FROM product_messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC,m.id DESC LIMIT 1) last_message_at,
                   (SELECT COUNT(*) FROM product_messages m WHERE m.conversation_id=c.id AND m.sender_role<>? AND m.created_at>COALESCE(c.$readColumn,'1970-01-01')) unread_count
            FROM product_conversations c JOIN products p ON p.id=c.product_id JOIN users u ON u.id=c.user_id LEFT JOIN product_feedback f ON f.id=c.feedback_id $filter
            ORDER BY c.updated_at DESC,c.id DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($owner ? [$user['role']] : [$user['role'],$user['id']]);
    echo json_encode(['conversations'=>$stmt->fetchAll(),'role'=>$user['role']]); exit;
}

$input = json_input();
if ($method === 'POST') {
    if ($user['role'] === 'owner') {
        $feedbackId=(int)($input['feedback_id']??0);
        if (!$feedbackId) { http_response_code(422); die(json_encode(['error'=>'A customer feedback entry is required.'])); }
        $pdo->beginTransaction();
        try {
            $stmt=$pdo->prepare('SELECT id,user_id,product_id FROM product_feedback WHERE id=? AND user_id IS NOT NULL FOR UPDATE');
            $stmt->execute([$feedbackId]);$feedback=$stmt->fetch();
            if (!$feedback) { $pdo->rollBack(); http_response_code(404); die(json_encode(['error'=>'Customer feedback not found.'])); }
            $stmt=$pdo->prepare('SELECT id FROM product_conversations WHERE feedback_id=?');$stmt->execute([$feedbackId]);$existing=$stmt->fetchColumn();
            if ($existing) { $pdo->commit(); echo json_encode(['ok'=>true,'conversation_id'=>(int)$existing]); exit; }
            $stmt=$pdo->prepare("INSERT INTO product_conversations(user_id,product_id,feedback_id,kind,status,owner_read_at) VALUES(?,?,?,'product','open',NOW()) RETURNING id");
            $stmt->execute([$feedback['user_id'],$feedback['product_id'],$feedbackId]);
            $id=(int)$stmt->fetchColumn();
            $pdo->commit();
            echo json_encode(['ok'=>true,'conversation_id'=>$id]); exit;
        } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
    }
    if ($user['role'] !== 'user') { http_response_code(403); die(json_encode(['error'=>'Only customers can start a product message or preorder.'])); }
    $productId = (int)($input['product_id'] ?? 0);
    $kind = ($input['kind'] ?? 'product') === 'preorder' ? 'preorder' : 'product';
    $quantity = max(1, min(100, (int)($input['quantity'] ?? 1)));
    $messageText = trim((string)($input['message'] ?? ''));
    if ($messageText === '') $messageText = $kind === 'preorder' ? "I'd like to preorder this product (quantity: $quantity)." : '';
    $messageLength=preg_match_all('/./us',$messageText);
    if (!$productId || $messageLength===false || $messageLength>1000) { http_response_code(422); die(json_encode(['error'=>'A valid product and message are required.'])); }
    $check = $pdo->prepare('SELECT id,stock FROM products WHERE id=?'); $check->execute([$productId]); $product = $check->fetch();
    if (!$product) { http_response_code(404); die(json_encode(['error'=>'Product not found.'])); }
    if ($kind === 'preorder' && (int)$product['stock'] > 0) { http_response_code(422); die(json_encode(['error'=>'This item is currently in stock; add it to your cart instead.'])); }
    $pdo->beginTransaction();
    try {
        $status = $kind === 'preorder' ? 'pending' : 'open';
        $stmt = $pdo->prepare("INSERT INTO product_conversations(user_id,product_id,kind,status,preorder_qty,user_read_at) VALUES(?,?,?,?,?,NOW()) RETURNING id");
        $stmt->execute([$user['id'],$productId,$kind,$status,$kind === 'preorder' ? $quantity : null]);
        $id = (int)$stmt->fetchColumn();
        $stmt = $pdo->prepare("INSERT INTO product_messages(conversation_id,sender_role,sender_id,message) VALUES(?,'user',?,?)");
        $stmt->execute([$id,$user['id'],$messageText]);
        $pdo->commit();
        echo json_encode(['ok'=>true,'id'=>$id]); exit;
    } catch (Throwable $e) { $pdo->rollBack(); throw $e; }
}

if ($method === 'PUT') {
    $id = (int)($input['id'] ?? 0);
    $messageText = trim((string)($input['message'] ?? ''));
    $messageLength=preg_match_all('/./us',$messageText);
    if (!$id || $messageText === '' || $messageLength===false || $messageLength > 1000) { http_response_code(422); die(json_encode(['error'=>'Conversation and a message of up to 1000 characters are required.'])); }
    $owner = $user['role'] === 'owner';
    $stmt = $pdo->prepare('SELECT id,user_id FROM product_conversations WHERE id=?'.($owner ? '' : ' AND user_id=?'));
    $stmt->execute($owner ? [$id] : [$id,$user['id']]);
    if (!$stmt->fetch()) { http_response_code(404); die(json_encode(['error'=>'Conversation not found.'])); }
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('INSERT INTO product_messages(conversation_id,sender_role,sender_id,message) VALUES(?,?,?,?)');
        $stmt->execute([$id,$user['role'],$user['id'],$messageText]);
        $readColumn = $owner ? 'owner_read_at' : 'user_read_at';
        $pdo->prepare("UPDATE product_conversations SET updated_at=NOW(),$readColumn=NOW() WHERE id=?")->execute([$id]);
        $pdo->commit();
        echo json_encode(['ok'=>true]); exit;
    } catch (Throwable $e) { $pdo->rollBack(); throw $e; }
}

if ($method === 'PATCH') {
    if ($user['role'] !== 'owner') { http_response_code(403); die(json_encode(['error'=>'Owner access only.'])); }
    $id = (int)($input['id'] ?? 0);
    $status = (string)($input['status'] ?? '');
    if (!$id || !in_array($status,['approved','rejected'],true)) { http_response_code(422); die(json_encode(['error'=>'Choose approve or reject for a preorder request.'])); }
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("SELECT c.id,c.preorder_qty,c.product_id,p.name FROM product_conversations c JOIN products p ON p.id=c.product_id WHERE c.id=? AND c.kind='preorder' AND c.status='pending' FOR UPDATE");
        $stmt->execute([$id]); $request = $stmt->fetch();
        if (!$request) { $pdo->rollBack(); http_response_code(404); die(json_encode(['error'=>'Pending preorder not found.'])); }
        $pdo->prepare('UPDATE product_conversations SET status=?,updated_at=NOW(),owner_read_at=NOW() WHERE id=?')->execute([$status,$id]);
        $message = $status === 'approved' ? 'Your preorder request was approved by the owner. No payment or stock has been taken; the owner will message you about fulfillment.' : 'Your preorder request was declined by the owner.';
        $pdo->prepare("INSERT INTO product_messages(conversation_id,sender_role,sender_id,message) VALUES(?,'system',NULL,?)")->execute([$id,$message]);
        $pdo->commit();
        echo json_encode(['ok'=>true,'status'=>$status]); exit;
    } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
}

http_response_code(405);
echo json_encode(['error'=>'Method not allowed.']);
