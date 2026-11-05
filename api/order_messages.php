<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');
$user = current_user();
if (!$user) { http_response_code(401); die(json_encode(['error'=>'Please sign in first.'])); }
$method=$_SERVER['REQUEST_METHOD'];
if ($method==='GET') {
  $orderId=(int)($_GET['order_id']??0);
  if ($user['role']==='owner') {
    if ($orderId) { $q=$pdo->prepare('SELECT m.id,m.order_id,m.message,m.created_at,o.name owner_name FROM order_messages m JOIN owners o ON o.id=m.owner_id WHERE m.order_id=? ORDER BY m.created_at ASC,m.id ASC'); $q->execute([$orderId]); }
    else $q=$pdo->query('SELECT m.id,m.order_id,m.message,m.created_at,o.name owner_name FROM order_messages m JOIN owners o ON o.id=m.owner_id ORDER BY m.created_at DESC,m.id DESC');
  } else {
    if (!$orderId) { http_response_code(422); die(json_encode(['error'=>'order_id is required.'])); }
    $check=$pdo->prepare('SELECT id FROM orders WHERE id=? AND user_id=?'); $check->execute([$orderId,$user['id']]);
    if (!$check->fetchColumn()) { http_response_code(404); die(json_encode(['error'=>'Order not found.'])); }
    $q=$pdo->prepare('SELECT m.id,m.order_id,m.message,m.created_at,o.name owner_name FROM order_messages m JOIN owners o ON o.id=m.owner_id WHERE m.order_id=? ORDER BY m.created_at ASC,m.id ASC'); $q->execute([$orderId]);
  }
  echo json_encode(['messages'=>$q->fetchAll(),'role'=>$user['role']]); exit;
}
if ($method==='POST') {
  $owner=require_owner(); $in=json_input(); $orderId=(int)($in['order_id']??0); $message=trim((string)($in['message']??''));
  if(!$orderId||$message===''){http_response_code(422);die(json_encode(['error'=>'Order and message are required.']));}
  if(mb_strlen($message)>1000){http_response_code(422);die(json_encode(['error'=>'Message is too long.']));}
  $check=$pdo->prepare('SELECT id FROM orders WHERE id=?');$check->execute([$orderId]); if(!$check->fetchColumn()){http_response_code(404);die(json_encode(['error'=>'Order not found.']));}
  $q=$pdo->prepare('INSERT INTO order_messages(order_id,owner_id,message) VALUES(?,?,?)');$q->execute([$orderId,$owner['id'],$message]);
  echo json_encode(['ok'=>true,'id'=>(int)$pdo->lastInsertId()]); exit;
}
http_response_code(405); echo json_encode(['error'=>'Method not allowed.']);
