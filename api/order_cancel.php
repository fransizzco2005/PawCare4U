<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/cancellation.php';
header('Content-Type: application/json; charset=utf-8');

$user = current_user();
if (!$user) { http_response_code(401); die(json_encode(['error'=>'Please sign in first.'])); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); die(json_encode(['error'=>'Method not allowed.'])); }
$input = json_input();
$orderId = (int)($input['order_id'] ?? 0);
try {
    $reason = pawcare_cancellation_reason($input, $user['role']);
} catch (InvalidArgumentException $e) {
    http_response_code(422); die(json_encode(['error'=>$e->getMessage()]));
}
if (!$orderId) { http_response_code(422); die(json_encode(['error'=>'Order is required.'])); }

$pdo->beginTransaction();
try {
    $orderStmt = $user['role'] === 'owner'
        ? $pdo->prepare('SELECT order_status FROM orders WHERE id=? FOR UPDATE')
        : $pdo->prepare('SELECT order_status FROM orders WHERE id=? AND user_id=? FOR UPDATE');
    $user['role'] === 'owner' ? $orderStmt->execute([$orderId]) : $orderStmt->execute([$orderId,$user['id']]);
    $status = $orderStmt->fetchColumn();
    if ($status === false) throw new DomainException('Order not found.');
    if ($status === 'cancelled') throw new DomainException('This order is already cancelled.');
    if ($user['role'] !== 'owner' && $status !== 'placed') {
        throw new DomainException('Orders can only be cancelled before packing or processing begins.');
    }
    if ($user['role'] !== 'owner') {
        $progress = $pdo->prepare("SELECT 1 FROM order_status_history WHERE order_id=? AND status IN ('processing','shipped','delivered') LIMIT 1");
        $progress->execute([$orderId]);
        if ($progress->fetchColumn()) throw new DomainException('Orders can only be cancelled before packing or processing begins.');
    }

    $items = $pdo->prepare('SELECT product_id,qty FROM order_items WHERE order_id=?');
    $items->execute([$orderId]);
    if (in_array($status, ['placed','processing'], true)) {
        $restock = $pdo->prepare('UPDATE products SET stock=stock+? WHERE id=?');
        foreach ($items->fetchAll() as $item) $restock->execute([$item['qty'],$item['product_id']]);
    }
    $pdo->prepare("UPDATE orders SET order_status='cancelled',payment_status=CASE WHEN payment_status='pending' THEN 'cancelled' ELSE payment_status END WHERE id=?")->execute([$orderId]);
    $pdo->prepare('INSERT INTO order_status_history(order_id,status,note) VALUES(?,?,?)')->execute([$orderId,'cancelled','Cancellation reason: '.$reason]);
    $pdo->commit();
    echo json_encode(['ok'=>true,'status'=>'cancelled','reason'=>$reason]);
} catch (DomainException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code($e->getMessage()==='Order not found.'?404:409);
    echo json_encode(['error'=>$e->getMessage()]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Order cancellation failed: '.$e->getMessage());
    http_response_code(500); echo json_encode(['error'=>'Could not cancel this order. Please try again.']);
}
