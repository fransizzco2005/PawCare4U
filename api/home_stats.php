<?php
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json; charset=utf-8');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $visits = $pdo->query('UPDATE site_stats SET visits = visits + 1 WHERE id = 1 RETURNING visits')->fetchColumn();
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $visits = $pdo->query('SELECT visits FROM site_stats WHERE id = 1')->fetchColumn();
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed.']);
        exit;
    }

    if ($visits === false) {
        throw new RuntimeException('Homepage statistics are not initialized.');
    }

    $rating = $pdo->query(
        'SELECT COUNT(rating)::int AS count, COALESCE(AVG(rating), 0)::numeric(3,2) AS average
         FROM product_feedback WHERE user_id IS NOT NULL AND rating IS NOT NULL'
    )->fetch();

    echo json_encode([
        'visits' => (int)$visits,
        'rating' => $rating,
    ]);
} catch (Throwable $error) {
    error_log('Unable to load PawCare homepage statistics: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Homepage statistics are temporarily unavailable.']);
}
