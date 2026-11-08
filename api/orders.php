<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

$user = current_user();
if (!$user) { http_response_code(401); die(json_encode(['error'=>'Please sign in first.'])); }

if ($user['role'] === 'owner') {
    $trash = ($_GET['view'] ?? '') === 'trash';
    $stmt = $pdo->prepare(
        "SELECT o.id,o.user_id,o.subtotal,o.shipping_fee,o.total,o.payment_method,o.payment_status,o.order_status,o.fulfillment_method,o.pickup_branch,o.created_at,
                o.archived_at,u.name customer_name,u.email customer_email,
                a.full_name,a.line1,a.city,a.province,a.postal_code,a.phone
         FROM orders o JOIN users u ON u.id=o.user_id
         JOIN addresses a ON a.id=o.address_id
         WHERE " . ($trash ? "o.archived_at IS NOT NULL" : "o.archived_at IS NULL") . "
         ORDER BY o.created_at DESC"
    );
    $stmt->execute();
} else {
    $stmt = $pdo->prepare(
        "SELECT o.id,o.user_id,o.subtotal,o.shipping_fee,o.total,o.payment_method,o.payment_status,o.order_status,o.fulfillment_method,o.pickup_branch,o.created_at,
                o.archived_at,a.full_name,a.line1,a.city,a.province,a.postal_code,a.phone
         FROM orders o JOIN addresses a ON a.id=o.address_id
         WHERE o.user_id=? ORDER BY o.created_at DESC"
    );
    $stmt->execute([$user['id']]);
}
$orders = $stmt->fetchAll();

$itemStmt = $pdo->prepare("SELECT name_snapshot name, price_snapshot price, qty FROM order_items WHERE order_id=?");
$histStmt = $pdo->prepare("SELECT status,note,changed_at FROM order_status_history WHERE order_id=? ORDER BY changed_at ASC,id ASC");
$msgStmt = $pdo->prepare("SELECT m.id,m.message,m.created_at,o.name owner_name FROM order_messages m JOIN owners o ON o.id=m.owner_id WHERE m.order_id=? ORDER BY m.created_at ASC,m.id ASC");
foreach ($orders as &$o) {
    $itemStmt->execute([$o['id']]); $o['items']=$itemStmt->fetchAll();
    $histStmt->execute([$o['id']]); $o['history']=$histStmt->fetchAll();
    $msgStmt->execute([$o['id']]); $o['messages']=$msgStmt->fetchAll();
    if (!$o['history']) $o['history']=[['status'=>$o['order_status'],'note'=>null,'changed_at'=>$o['created_at']]];
}
unset($o);
echo json_encode(['orders'=>$orders,'role'=>$user['role']]);
