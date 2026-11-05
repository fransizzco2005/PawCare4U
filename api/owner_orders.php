<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');
require_owner();
$in=json_input();
$orderId=(int)($in['order_id']??0);
$status=$in['status']??'';
$allowed=['placed','processing','shipped','delivered','cancelled'];
if (!$orderId || !in_array($status,$allowed,true)) {
 http_response_code(422); die(json_encode(['error'=>'Invalid order or status.']));
}
$stmt=$pdo->prepare('SELECT order_status FROM orders WHERE id=?');
$stmt->execute([$orderId]);
$current=$stmt->fetchColumn();
if ($current===false) { http_response_code(404); die(json_encode(['error'=>'Order not found.'])); }
$pdo->beginTransaction();
try {
 $pdo->prepare('UPDATE orders SET order_status=? WHERE id=?')->execute([$status,$orderId]);
 $pdo->prepare('INSERT INTO order_status_history(order_id,status,note) VALUES(?,?,?)')
     ->execute([$orderId,$status,'Status updated by owner']);
 $pdo->commit();
 echo json_encode(['ok'=>true,'status'=>$status]);
} catch(Exception $e) {
 $pdo->rollBack(); http_response_code(500); die(json_encode(['error'=>'Could not update order.']));
}
