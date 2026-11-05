<?php
require_once __DIR__ . '/db.php';

/** Returns the logged-in user's row, or null. */
function current_user(): ?array {
    global $pdo;
    if (!empty($_SESSION['owner_id'])) {
        $stmt = $pdo->prepare('SELECT id, name, email FROM owners WHERE id = ?');
        $stmt->execute([$_SESSION['owner_id']]);
        $owner = $stmt->fetch();
        if ($owner) {
            $owner['role'] = 'owner';
            return $owner;
        }
    }
    if (empty($_SESSION['user_id'])) return null;
    $stmt = $pdo->prepare('SELECT id, name, email, phone FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    if ($user) $user['role'] = 'user';
    return $user ?: null;
}

function current_owner(): ?array {
    global $pdo;
    if (empty($_SESSION['owner_id'])) return null;
    $stmt = $pdo->prepare('SELECT id, name, email FROM owners WHERE id = ?');
    $stmt->execute([$_SESSION['owner_id']]);
    $owner = $stmt->fetch();
    if ($owner) $owner['role'] = 'owner';
    return $owner ?: null;
}

function require_owner(): array {
    $owner = current_owner();
    if (!$owner) {
        http_response_code(403);
        header('Content-Type: application/json');
        die(json_encode(['error' => 'Owner access only.']));
    }
    return $owner;
}

/** Stops the request with a 401 JSON error if nobody is logged in.
 *  Use this in api/*.php files only -- see require_login_page() for
 *  real HTML pages like order_confirmation.php. */
function require_login(): array {
    $user = current_user();
    if (!$user) {
        http_response_code(401);
        header('Content-Type: application/json');
        die(json_encode(['error' => 'Please sign in first.']));
    }
    return $user;
}

/** Same idea as require_login(), but for a real HTML page (not a JSON
 *  API endpoint). Redirects back to the homepage instead of dying with
 *  a raw JSON error string, which would otherwise render as broken
 *  text on an HTML page like order_confirmation.php. */
function require_login_page(): array {
    $user = current_user();
    if (!$user) {
        header('Location: index.html#account');
        exit;
    }
    return $user;
}

/**
 * Guests get a random token stored in a cookie so their cart survives a
 * refresh even before they create an account. It's merged into their
 * account cart automatically the moment they log in (see api/login.php).
 */
function guest_token(): string {
    if (empty($_COOKIE['pawcare_guest'])) {
        $token = bin2hex(random_bytes(16));
        setcookie('pawcare_guest', $token, time() + 60 * 60 * 24 * 30, '/');
        $_COOKIE['pawcare_guest'] = $token;
    }
    return $_COOKIE['pawcare_guest'];
}

function json_input(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}
