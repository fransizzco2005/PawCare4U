<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    die(json_encode(['error' => 'Method not allowed. Use POST to sign in.']));
}

$in = json_input();
$email = trim(strtolower($in['email'] ?? ''));
$pass  = $in['password'] ?? '';

/* Owner accounts are separate from normal customer accounts. */
$ownerStmt = $pdo->prepare('SELECT id, name, email, password_hash FROM owners WHERE email = ?');
$ownerStmt->execute([$email]);
$owner = $ownerStmt->fetch();

if ($owner && password_verify($pass, $owner['password_hash'])) {
    $_SESSION['owner_id'] = (int)$owner['id'];
    unset($_SESSION['user_id']);
    unset($owner['password_hash']);
    $owner['role'] = 'owner';
    echo json_encode(['user' => $owner]);
    exit;
}

$stmt = $pdo->prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($pass, $user['password_hash'])) {
    http_response_code(401);
    die(json_encode(['error' => 'Incorrect email or password.']));
}

$_SESSION['user_id'] = $user['id'];
unset($_SESSION['owner_id']);

// Merge guest cart into the signed-in account without creating duplicate product rows.
if (!empty($_COOKIE['pawcare_guest'])) {
    $guest = $_COOKIE['pawcare_guest'];
    $guestStmt = $pdo->prepare('SELECT product_id, qty FROM cart_items WHERE guest_token = ?');
    $guestStmt->execute([$guest]);
    foreach ($guestStmt->fetchAll() as $g) {
        $existingStmt = $pdo->prepare('SELECT id, qty FROM cart_items WHERE user_id = ? AND product_id = ? LIMIT 1');
        $existingStmt->execute([$user['id'], (int)$g['product_id']]);
        $existing = $existingStmt->fetch();
        if ($existing) {
            $pdo->prepare('UPDATE cart_items SET qty = qty + ? WHERE id = ?')->execute([(int)$g['qty'], (int)$existing['id']]);
            $pdo->prepare('DELETE FROM cart_items WHERE guest_token = ? AND product_id = ?')->execute([$guest, (int)$g['product_id']]);
        } else {
            $pdo->prepare('UPDATE cart_items SET user_id = ?, guest_token = NULL WHERE guest_token = ? AND product_id = ?')->execute([$user['id'], $guest, (int)$g['product_id']]);
        }
    }
}

unset($user['password_hash']);
$user['role'] = 'user';
echo json_encode(['user' => $user]);
