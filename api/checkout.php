<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../payment/paymongo.php';
header('Content-Type: application/json');

$user = require_login(); // must be signed in to check out
$in   = json_input();

$fullName  = trim($in['full_name']  ?? '');
$line1     = trim($in['line1']      ?? '');
$city      = trim($in['city']       ?? '');
$province  = trim($in['province']   ?? '');
$postal    = trim($in['postal_code']?? '');
$phone     = trim($in['phone']      ?? '');
$method    = $in['payment_method']  ?? 'cod'; // cod | gcash | card

if (!$fullName || !$line1 || !$city || !$province || !$postal || !$phone) {
    http_response_code(422);
    die(json_encode(['error' => 'Please fill in the full delivery address.']));
}
if (!in_array($method, ['cod', 'gcash', 'card'], true)) {
    http_response_code(422);
    die(json_encode(['error' => 'Unknown payment method.']));
}

// 1. Load the cart
$cartStmt = $pdo->prepare(
    'SELECT c.product_id, c.qty, p.name, p.price, p.stock
     FROM cart_items c JOIN products p ON p.id = c.product_id
     WHERE c.user_id = ?'
);
$cartStmt->execute([$user['id']]);
$items = $cartStmt->fetchAll();

if (!$items) {
    http_response_code(422);
    die(json_encode(['error' => 'Your cart is empty.']));
}
foreach ($items as $it) {
    if ($it['qty'] > $it['stock']) {
        http_response_code(422);
        die(json_encode(['error' => "Only {$it['stock']} left of {$it['name']}."]));
    }
}

$subtotal    = array_sum(array_map(fn($i) => $i['price'] * $i['qty'], $items));
$shippingFee = $subtotal >= 50 ? 0 : 4.99;
$total       = $subtotal + $shippingFee;

$pdo->beginTransaction();
try {
    // 2. Save the delivery address
    $pdo->prepare(
        'INSERT INTO addresses (user_id, full_name, line1, city, province, postal_code, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    )->execute([$user['id'], $fullName, $line1, $city, $province, $postal, $phone]);
    $addressId = (int)$pdo->lastInsertId();

    // 3. Create the order
    $pdo->prepare(
        'INSERT INTO orders (user_id, address_id, subtotal, shipping_fee, total, payment_method, payment_status, order_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $user['id'], $addressId, $subtotal, $shippingFee, $total, $method,
        $method === 'cod' ? 'pending' : 'pending',
        'placed',
    ]);
    $orderId = (int)$pdo->lastInsertId();
    $pdo->prepare('INSERT INTO order_status_history (order_id,status,note) VALUES (?, ?, ?)')->execute([$orderId, 'placed', 'Order placed']);

    // 4. Snapshot the line items + decrement stock
    $itemStmt  = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_id, name_snapshot, price_snapshot, qty) VALUES (?, ?, ?, ?, ?)'
    );
    $stockStmt = $pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    foreach ($items as $it) {
        $itemStmt->execute([$orderId, $it['product_id'], $it['name'], $it['price'], $it['qty']]);
        $stockStmt->execute([$it['qty'], $it['product_id']]);
    }

    // 5. Empty the cart
    $pdo->prepare('DELETE FROM cart_items WHERE user_id = ?')->execute([$user['id']]);

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    die(json_encode(['error' => 'Could not place the order. Please try again.']));
}

// 6. Cash on delivery needs no payment gateway — done.
if ($method === 'cod') {
    echo json_encode(['order_id' => $orderId, 'redirect' => "order_confirmation.php?id=$orderId"]);
    exit;
}

// 7. GCash / card go through PayMongo's hosted checkout link.
try {
    $link = paymongo_create_link($total, "PawCare order #$orderId", "ORDER-$orderId");
    $pdo->prepare('UPDATE orders SET paymongo_reference = ? WHERE id = ?')
        ->execute([$link['id'], $orderId]);
    echo json_encode([
        'order_id'     => $orderId,
        'checkout_url' => $link['attributes']['checkout_url'],
    ]);
} catch (Exception $e) {
    // Order stays recorded as "pending" — the shopper can retry payment later.
    http_response_code(502);
    echo json_encode([
        'order_id' => $orderId,
        'error'    => 'Payment could not be started: ' . $e->getMessage() .
                       ' (Have you set a real PAYMONGO_SECRET_KEY in config.php?)',
    ]);
}
