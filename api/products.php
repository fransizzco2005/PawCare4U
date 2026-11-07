<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

$user = current_user();
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'PUT') {
    if (!$user || $user['role'] !== 'owner') { http_response_code(403); die(json_encode(['error'=>'Owner access only.'])); }
    $input = json_input();
    $id = (int)($input['product_id'] ?? 0);
    $price = filter_var($input['price'] ?? null, FILTER_VALIDATE_FLOAT);
    $stock = filter_var($input['stock'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $price === false || $price <= 0 || $stock === false || $stock < 0 || $stock > 1000000) {
        http_response_code(422); die(json_encode(['error'=>'Enter a valid product, positive price, and stock from 0 to 1,000,000.']));
    }
    $stmt = $pdo->prepare('UPDATE products SET price=?,stock=? WHERE id=? RETURNING id,name,category,subcategory,price,stock');
    $stmt->execute([$price,$stock,$id]);
    $product = $stmt->fetch();
    if (!$product) { http_response_code(404); die(json_encode(['error'=>'Product not found.'])); }
    echo json_encode(['ok'=>true,'product'=>$product]); exit;
}
if ($method !== 'GET') { http_response_code(405); die(json_encode(['error'=>'Method not allowed.'])); }

$category = $_GET['category'] ?? 'all';
$search   = trim($_GET['q'] ?? '');
$subcategory = trim($_GET['subcategory'] ?? '');

$sql = 'SELECT id, name, category, subcategory, price, old_price AS oldPrice, rating, reviews, tag, icon, stock, image_url FROM products WHERE 1=1';
$params = [];

if ($category !== 'all') {
    $sql .= ' AND category = ?';
    $params[] = $category;
}
if ($subcategory !== '') {
    $sql .= ' AND subcategory = ?';
    $params[] = $subcategory;
}
if ($search !== '') {
    $sql .= ' AND (name LIKE ? OR subcategory LIKE ?)';
    $params[] = '%' . $search . '%';
    $params[] = '%' . $search . '%';
}
$sql .= ' ORDER BY id';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
echo json_encode($stmt->fetchAll());
