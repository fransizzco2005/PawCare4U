<?php
require_once __DIR__ . '/../includes/db.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $result = $pdo->query('SELECT COUNT(*) AS product_count FROM products')->fetch();
    echo json_encode([
        'ok' => true,
        'database' => 'supabase',
        'product_count' => (int)($result['product_count'] ?? 0),
    ]);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Database connection failed.']);
}
