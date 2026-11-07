<?php

require_once __DIR__ . '/../config.php';

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$relativePath = ltrim(str_replace('\\', '/', $requestPath), '/');
$rootDirectory = realpath(__DIR__ . '/..');

if ($relativePath === '') {
    $relativePath = 'index.php';
}

$targetPath = realpath($rootDirectory . DIRECTORY_SEPARATOR . $relativePath);
if (
    $targetPath === false ||
    strncmp($targetPath, $rootDirectory, strlen($rootDirectory)) !== 0 ||
    !is_file($targetPath) ||
    strtolower(pathinfo($targetPath, PATHINFO_EXTENSION)) !== 'php'
) {
    http_response_code(404);
    echo 'Not found';
    exit;
}

$_SERVER['SCRIPT_NAME'] = '/' . $relativePath;
$_SERVER['PHP_SELF'] = '/' . $relativePath;
$_SERVER['SCRIPT_FILENAME'] = $targetPath;
chdir(dirname($targetPath));

require $targetPath;
