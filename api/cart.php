<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

$user  = current_user();
$owner = $user ? ['user_id = ?', $user['id']] : ['guest_token = ?', guest_token()];

function cart_rows(PDO $pdo, array $owner): array {
    $sql = "SELECT c.product_id, c.qty, p.name, p.price, p.icon, p.category, p.image_url
            FROM cart_items c JOIN products p ON p.id = c.product_id
            WHERE c.$owner[0]";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$owner[1]]);
    return $stmt->fetchAll();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    echo json_encode(['items' => cart_rows($pdo, $owner)]);
    exit;
}

if ($method === 'POST') {
    // Add to cart, or set an explicit quantity
    $in = json_input();
    $productId = (int)($in['product_id'] ?? 0);
    $delta     = isset($in['delta']) ? (int)$in['delta'] : null;   // +1 / -1
    $setQty    = isset($in['qty'])   ? (int)$in['qty']   : null;   // absolute value

    if (!$productId) { http_response_code(422); die(json_encode(['error' => 'product_id is required.'])); }

    // Static catalog pages can supply product metadata with the add request.
    // If the matching database row is missing, create it so the cart/checkout
    // pipeline still works without making JavaScript responsible for image src.
    $exists = $pdo->prepare('SELECT id FROM products WHERE id = ?');
    $exists->execute([$productId]);
    if (!$exists->fetchColumn() && !empty($in['product'])) {
        $p = $in['product'];
        $ins = $pdo->prepare('INSERT INTO products (id,name,category,subcategory,price,old_price,rating,reviews,tag,stock,image_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
        $ins->execute([
            $productId, trim((string)($p['name'] ?? 'PawCare Product')),
            trim((string)($p['category'] ?? 'pet')), trim((string)($p['subcategory'] ?? '')),
            (float)($p['price'] ?? 0), ($p['old_price'] ?? '') !== '' ? (float)$p['old_price'] : null,
            (float)($p['rating'] ?? 4.5), (int)($p['reviews'] ?? 0),
            ($p['tag'] ?? '') !== '' ? trim((string)$p['tag']) : null, (int)($p['stock'] ?? 100),
            ($p['image_url'] ?? '') !== '' ? trim((string)$p['image_url']) : null
        ]);
    }

    $find = $pdo->prepare("SELECT id, qty FROM cart_items WHERE product_id = ? AND $owner[0]");
    $find->execute([$productId, $owner[1]]);
    $existing = $find->fetch();

    if ($existing) {
        $newQty = $setQty !== null ? $setQty : $existing['qty'] + ($delta ?? 1);
        if ($newQty <= 0) {
            $pdo->prepare('DELETE FROM cart_items WHERE id = ?')->execute([$existing['id']]);
        } else {
            $pdo->prepare('UPDATE cart_items SET qty = ? WHERE id = ?')->execute([$newQty, $existing['id']]);
        }
    } else {
        $newQty = $setQty ?? 1;
        if ($newQty > 0) {
            $col = ($user && $user['role'] === 'user') ? 'user_id' : 'guest_token';
            $pdo->prepare("INSERT INTO cart_items (product_id, qty, $col) VALUES (?, ?, ?)")
                ->execute([$productId, $newQty, $owner[1]]);
        }
    }

    echo json_encode(['items' => cart_rows($pdo, $owner)]);
    exit;
}

if ($method === 'DELETE') {
    $in = json_input();
    $productId = (int)($in['product_id'] ?? 0);
    $pdo->prepare("DELETE FROM cart_items WHERE product_id = ? AND $owner[0]")->execute([$productId, $owner[1]]);
    echo json_encode(['items' => cart_rows($pdo, $owner)]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
