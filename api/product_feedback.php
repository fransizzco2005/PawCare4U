<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');
$user=current_user();
$method=$_SERVER['REQUEST_METHOD'];

if ($method==='GET') {
    $productId=(int)($_GET['product_id']??0);
    if ($user && $user['role']==='owner') {
        $stmt=$productId
          ? $pdo->prepare("SELECT f.*,u.name user_name,p.name product_name FROM product_feedback f JOIN users u ON u.id=f.user_id JOIN products p ON p.id=f.product_id WHERE f.product_id=? ORDER BY f.created_at DESC")
          : $pdo->query("SELECT f.*,u.name user_name,p.name product_name FROM product_feedback f JOIN users u ON u.id=f.user_id JOIN products p ON p.id=f.product_id ORDER BY f.created_at DESC");
        if ($productId) $stmt->execute([$productId]);
        echo json_encode(['feedback'=>$stmt->fetchAll()]); exit;
    }
    if (!$user || $user['role']!=='user') { http_response_code(401); die(json_encode(['error'=>'Please sign in first.'])); }
    if (!$productId) { http_response_code(422); die(json_encode(['error'=>'product_id is required.'])); }
    $stmt=$pdo->prepare("SELECT f.id,f.comment,f.owner_reply,f.created_at,f.replied_at,u.name user_name FROM product_feedback f JOIN users u ON u.id=f.user_id WHERE f.product_id=? AND f.user_id=? ORDER BY f.created_at DESC");
    $stmt->execute([$productId,$user['id']]);
    echo json_encode(['feedback'=>$stmt->fetchAll()]); exit;
}

if (!$user) { http_response_code(401); die(json_encode(['error'=>'Please sign in first.'])); }
$in=json_input();

if ($method==='POST') {
    if ($user['role']!=='user') { http_response_code(403); die(json_encode(['error'=>'Customers only.'])); }
    $productId=(int)($in['product_id']??0); $comment=trim((string)($in['comment']??''));
    if(!$productId||$comment===''){http_response_code(422);die(json_encode(['error'=>'Product and comment are required.']));}
    $check=$pdo->prepare('SELECT id FROM products WHERE id=?');$check->execute([$productId]);
    if(!$check->fetchColumn()){http_response_code(404);die(json_encode(['error'=>'Product not found.']));}
    $stmt=$pdo->prepare('INSERT INTO product_feedback(product_id,user_id,comment) VALUES(?,?,?) RETURNING id');
    $stmt->execute([$productId,$user['id'],$comment]);
    echo json_encode(['ok'=>true,'id'=>(int)$stmt->fetchColumn()]); exit;
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
