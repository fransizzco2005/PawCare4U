<?php
require_once __DIR__ . '/../includes/db.php';
header('Content-Type: application/json');

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
