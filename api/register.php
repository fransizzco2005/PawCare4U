<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

$in = json_input();
$name  = trim($in['name']  ?? '');
$email = trim(strtolower($in['email'] ?? ''));
$pass  = $in['password'] ?? '';

if ($name === '' || $email === '' || strlen($pass) < 6) {
    http_response_code(422);
    die(json_encode(['error' => 'Name, a valid email, and a password of at least 6 characters are required.']));
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    die(json_encode(['error' => 'That email address does not look valid.']));
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    die(json_encode(['error' => 'An account with that email already exists. Try signing in instead.']));
}

$hash = password_hash($pass, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
$stmt->execute([$name, $email, $hash]);
$userId = (int)$pdo->lastInsertId();

// Log the new user straight in
$_SESSION['user_id'] = $userId;
unset($_SESSION['owner_id']);

// Merge guest cart into the signed-in account without creating duplicate product rows.
if (!empty($_COOKIE['pawcare_guest'])) {
    $guest = $_COOKIE['pawcare_guest'];
    $guestStmt = $pdo->prepare('SELECT product_id, qty FROM cart_items WHERE guest_token = ?');
    $guestStmt->execute([$guest]);
    foreach ($guestStmt->fetchAll() as $g) {
        $existingStmt = $pdo->prepare('SELECT id, qty FROM cart_items WHERE user_id = ? AND product_id = ? LIMIT 1');
        $existingStmt->execute([$userId, (int)$g['product_id']]);
        $existing = $existingStmt->fetch();
        if ($existing) {
            $pdo->prepare('UPDATE cart_items SET qty = qty + ? WHERE id = ?')->execute([(int)$g['qty'], (int)$existing['id']]);
            $pdo->prepare('DELETE FROM cart_items WHERE guest_token = ? AND product_id = ?')->execute([$guest, (int)$g['product_id']]);
        } else {
            $pdo->prepare('UPDATE cart_items SET user_id = ?, guest_token = NULL WHERE guest_token = ? AND product_id = ?')->execute([$userId, $guest, (int)$g['product_id']]);
        }
    }
}

echo json_encode(['user' => ['id' => $userId, 'name' => $name, 'email' => $email, 'role' => 'user']]);
