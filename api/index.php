<?php

$rootIndex = __DIR__ . '/../index.php';
if (!is_file($rootIndex)) {
    http_response_code(500);
    echo 'Application entry point missing';
    exit;
}

require $rootIndex;
