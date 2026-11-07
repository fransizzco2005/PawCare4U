<?php

$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (preg_match('#^/api/(.+\.php)$#', $requestUri, $matches)) {
    $apiFile = __DIR__ . '/' . basename($matches[1]);
    if (is_file($apiFile)) {
        require $apiFile;
        exit;
    }

    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'API endpoint not found.']);
    exit;
}

$rootIndex = __DIR__ . '/../index.php';
if (!is_file($rootIndex)) {
    http_response_code(500);
    echo 'Application entry point missing';
    exit;
}

require $rootIndex;
