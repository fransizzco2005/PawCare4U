<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');
require_owner();
$in=json_input();
$orderId=(int)($in['order_id']??0);
$status=$in['status']??'';
$allowed=['placed','processing','shipped','delivered'];
if (!$orderId || !in_array($status,$allowed,true)) {
 http_response_code(422); die(json_encode(['error'=>'Invalid order or status.']));
}
$pdo->beginTransaction();
try {
 $stmt=$pdo->prepare('UPDATE orders SET order_status=? WHERE id=? AND order_status<>? AND archived_at IS NULL RETURNING id');
 $stmt->execute([$status,$orderId,'cancelled']);
 if (!$stmt->fetchColumn()) {
  $pdo->rollBack();
  $exists=$pdo->prepare('SELECT order_status,archived_at FROM orders WHERE id=?');
  $exists->execute([$orderId]);
  $existing=$exists->fetch();
  $existingStatus=$existing['order_status']??false;
  http_response_code($existingStatus===false?404:409);
  die(json_encode(['error'=>$existingStatus===false?'Order not found.':($existing['archived_at']!==null?'Move this order out of the trash before updating it.':'Cancelled orders cannot be updated.')]));
 }
 $pdo->prepare('INSERT INTO order_status_history(order_id,status,note) VALUES(?,?,?)')
     ->execute([$orderId,$status,'Status updated by owner']);
 $pdo->commit();
 echo json_encode(['ok'=>true,'status'=>$status]);
} catch(Exception $e) {
 $pdo->rollBack(); http_response_code(500); die(json_encode(['error'=>'Could not update order.']));
}
