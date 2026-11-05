<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

$user = current_user();
if (!$user) { http_response_code(401); die(json_encode(['error'=>'Please sign in first.'])); }

$uploadDir = __DIR__ . '/../uploads/profiles';
$publicDir = 'uploads/profiles';
if (!is_dir($uploadDir)) @mkdir($uploadDir, 0755, true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($user['role'] === 'owner') {
        $stmt = $pdo->prepare('SELECT id,name,email,profile_name,avatar_url FROM owners WHERE id=?');
    } else {
        $stmt = $pdo->prepare('SELECT id,name,email,phone,nickname,avatar_url FROM users WHERE id=?');
    }
    $stmt->execute([$user['id']]);
    $profile = $stmt->fetch() ?: $user;
    $profile['role'] = $user['role'];
    echo json_encode(['profile'=>$profile]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); die(json_encode(['error'=>'Method not allowed.']));
}

$nickname = trim((string)($_POST['nickname'] ?? ''));
$name = trim((string)($_POST['name'] ?? ''));

if ($user['role'] === 'owner') {
    // Owner display name is editable too, but the login email/identity stays separate.
    if ($name === '') $name = $user['name'];
    if (mb_strlen($name) > 120) { http_response_code(422); die(json_encode(['error'=>'Name is too long.'])); }
    $avatar = null;
    if (!empty($_FILES['avatar']['tmp_name'])) $avatar = save_avatar($_FILES['avatar'], $uploadDir, $publicDir, 'owner_'.$user['id']);
    if ($avatar !== null) {
        $pdo->prepare('UPDATE owners SET name=?, profile_name=?, avatar_url=? WHERE id=?')->execute([$name, $nickname, $avatar, $user['id']]);
    } else {
        $pdo->prepare('UPDATE owners SET name=?, profile_name=? WHERE id=?')->execute([$name, $nickname, $user['id']]);
    }
} else {
    if ($nickname === '') $nickname = $user['name'];
    if (mb_strlen($nickname) > 80) { http_response_code(422); die(json_encode(['error'=>'Nickname is too long.'])); }
    $avatar = null;
    if (!empty($_FILES['avatar']['tmp_name'])) $avatar = save_avatar($_FILES['avatar'], $uploadDir, $publicDir, 'user_'.$user['id']);
    if ($avatar !== null) {
        $pdo->prepare('UPDATE users SET nickname=?, avatar_url=? WHERE id=?')->execute([$nickname, $avatar, $user['id']]);
    } else {
        $pdo->prepare('UPDATE users SET nickname=? WHERE id=?')->execute([$nickname, $user['id']]);
    }
}

// Return the fresh profile.
if ($user['role'] === 'owner') {
    $stmt = $pdo->prepare('SELECT id,name,email,profile_name,avatar_url FROM owners WHERE id=?');
} else {
    $stmt = $pdo->prepare('SELECT id,name,email,phone,nickname,avatar_url FROM users WHERE id=?');
}
$stmt->execute([$user['id']]);
$profile = $stmt->fetch();
$profile['role'] = $user['role'];
echo json_encode(['ok'=>true,'profile'=>$profile]);

function save_avatar(array $file, string $uploadDir, string $publicDir, string $prefix): string {
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Could not upload the profile image.');
    }
    if (($file['size'] ?? 0) > 4 * 1024 * 1024) {
        http_response_code(422); die(json_encode(['error'=>'Profile image must be 4MB or smaller.']));
    }
    $info = @getimagesize($file['tmp_name']);
    if (!$info) { http_response_code(422); die(json_encode(['error'=>'Please upload a valid image.'])); }
    $mime = $info['mime'] ?? '';
    $ext = match ($mime) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        default => ''
    };
    if ($ext === '') { http_response_code(422); die(json_encode(['error'=>'Use JPG, PNG, WEBP, or GIF for the profile image.'])); }
    $filename = $prefix.'_'.bin2hex(random_bytes(6)).'.'.$ext;
    $target = rtrim($uploadDir,'/\\').DIRECTORY_SEPARATOR.$filename;
    if (!move_uploaded_file($file['tmp_name'], $target)) {
        http_response_code(500); die(json_encode(['error'=>'Could not save the profile image.']));
    }
    return rtrim($publicDir,'/').'/'.$filename;
}
