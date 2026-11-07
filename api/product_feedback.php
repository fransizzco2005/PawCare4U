<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');
$user=current_user();
$method=$_SERVER['REQUEST_METHOD'];

if ($method==='GET') {
    $productId=(int)($_GET['product_id']??0);
    if ($user && $user['role']==='owner') {
        $stmt=$productId
          ? $pdo->prepare("SELECT f.*,COALESCE(u.name,o.name) user_name,CASE WHEN f.owner_id IS NOT NULL THEN 'owner' ELSE 'user' END sender_role,p.name product_name FROM product_feedback f LEFT JOIN users u ON u.id=f.user_id LEFT JOIN owners o ON o.id=f.owner_id JOIN products p ON p.id=f.product_id WHERE f.product_id=? ORDER BY f.created_at DESC")
          : $pdo->query("SELECT f.*,COALESCE(u.name,o.name) user_name,CASE WHEN f.owner_id IS NOT NULL THEN 'owner' ELSE 'user' END sender_role,p.name product_name FROM product_feedback f LEFT JOIN users u ON u.id=f.user_id LEFT JOIN owners o ON o.id=f.owner_id JOIN products p ON p.id=f.product_id ORDER BY f.created_at DESC");
        if ($productId) $stmt->execute([$productId]);
        echo json_encode(['feedback'=>$stmt->fetchAll()]); exit;
    }
    if (!$productId) { http_response_code(422); die(json_encode(['error'=>'product_id is required.'])); }
    if (!$user || $user['role']!=='user') {
        $stmt=$pdo->prepare("SELECT f.id,f.rating,f.comment,f.created_at,u.name user_name FROM product_feedback f JOIN users u ON u.id=f.user_id WHERE f.product_id=? AND f.user_id IS NOT NULL ORDER BY f.created_at DESC LIMIT 50");
        $stmt->execute([$productId]);
        $feedback=$stmt->fetchAll();
        $summaryStmt=$pdo->prepare('SELECT COUNT(rating) count,COALESCE(AVG(rating),0) average FROM product_feedback WHERE product_id=? AND user_id IS NOT NULL');
        $summaryStmt->execute([$productId]);
        echo json_encode(['feedback'=>$feedback,'summary'=>$summaryStmt->fetch(),'role'=>'guest']); exit;
    }
    $stmt=$pdo->prepare("SELECT f.id,f.rating,f.comment,f.created_at,u.name user_name FROM product_feedback f JOIN users u ON u.id=f.user_id WHERE f.product_id=? AND f.user_id IS NOT NULL ORDER BY f.created_at DESC LIMIT 50");
    $stmt->execute([$productId]);
    $summaryStmt=$pdo->prepare('SELECT COUNT(rating) count,COALESCE(AVG(rating),0) average FROM product_feedback WHERE product_id=? AND user_id IS NOT NULL');
    $summaryStmt->execute([$productId]);
    echo json_encode(['feedback'=>$stmt->fetchAll(),'summary'=>$summaryStmt->fetch(),'role'=>'user']); exit;
}

if (!$user) { http_response_code(401); die(json_encode(['error'=>'Please sign in first.'])); }
$in=json_input();

if ($method==='POST') {
    if (!in_array($user['role'],['user','owner'],true)) { http_response_code(403); die(json_encode(['error'=>'Please sign in to leave product feedback.'])); }
    $productId=(int)($in['product_id']??0); $rating=filter_var($in['rating']??null,FILTER_VALIDATE_INT); $comment=trim((string)($in['comment']??''));
    $commentLength=preg_match_all('/./us',$comment);
    if(!$productId||$rating===false||$rating===null||$rating<1||$rating>5||$commentLength===false||$commentLength>1000){http_response_code(422);die(json_encode(['error'=>'A product and a 1–5 star rating are required; comments may be up to 1000 characters.']));}
    $check=$pdo->prepare('SELECT id FROM products WHERE id=?');$check->execute([$productId]);
    if(!$check->fetchColumn()){http_response_code(404);die(json_encode(['error'=>'Product not found.']));}
    $senderColumn=$user['role']==='owner'?'owner_id':'user_id';
    $pdo->beginTransaction();
    try {
        $stmt=$pdo->prepare("INSERT INTO product_feedback(product_id,$senderColumn,rating,comment) VALUES(?,?,?,?) RETURNING id");
        $stmt->execute([$productId,$user['id'],$rating,$comment!==''?$comment:null]);
        $feedbackId=(int)$stmt->fetchColumn();
        $conversationId=null;
        if ($user['role']==='user' && $comment!=='') {
            $conversation=$pdo->prepare("INSERT INTO product_conversations(user_id,product_id,feedback_id,kind,status,user_read_at) VALUES(?,?,?,'product','open',NOW()) RETURNING id");
            $conversation->execute([$user['id'],$productId,$feedbackId]);
            $conversationId=(int)$conversation->fetchColumn();
            $message=$pdo->prepare("INSERT INTO product_messages(conversation_id,sender_role,sender_id,message) VALUES(?,'user',?,?)");
            $message->execute([$conversationId,$user['id'],$comment]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    echo json_encode(['ok'=>true,'id'=>$feedbackId,'conversation_id'=>$conversationId]); exit;
}

if ($method==='PUT') {
    require_owner();
    $id=(int)($in['id']??0); $reply=trim((string)($in['owner_reply']??''));
    if(!$id||$reply===''){http_response_code(422);die(json_encode(['error'=>'Feedback id and reply are required.']));}
    $stmt=$pdo->prepare('UPDATE product_feedback SET owner_reply=?,replied_at=NOW() WHERE id=?');
    $stmt->execute([$reply,$id]);
    echo json_encode(['ok'=>true]); exit;
}

http_response_code(405); echo json_encode(['error'=>'Method not allowed.']);
