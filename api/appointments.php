<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json; charset=utf-8');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $user = current_user();
        if (!$user) {
            echo json_encode(['appointments' => []]);
            exit;
        }
        if ($user['role'] === 'owner') {
            $stmt = $pdo->query("SELECT a.id, CONCAT('PC-', LPAD(a.id::text, 6, '0')) AS reference, s.name AS service_name, a.branch, a.appointment_date, a.appointment_time, a.customer_name, a.email, a.phone, a.pet_name, a.pet_type, a.pet_age, a.notes, a.status, a.created_at FROM appointments a JOIN services s ON s.id = a.service_id ORDER BY a.appointment_date ASC, a.appointment_time ASC, a.id DESC");
            echo json_encode(['appointments' => $stmt->fetchAll(), 'role' => 'owner']);
        } else {
            $stmt = $pdo->prepare("SELECT a.id, CONCAT('PC-', LPAD(a.id::text, 6, '0')) AS reference, s.name AS service_name, a.branch, a.appointment_date, a.appointment_time, a.customer_name, a.email, a.phone, a.pet_name, a.pet_type, a.pet_age, a.notes, a.status, a.created_at FROM appointments a JOIN services s ON s.id = a.service_id WHERE a.user_id = ? ORDER BY a.appointment_date ASC, a.appointment_time ASC, a.id DESC");
            $stmt->execute([$user['id']]);
            echo json_encode(['appointments' => $stmt->fetchAll(), 'role' => 'user']);
        }
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $owner = current_owner();
        if (!$owner) { http_response_code(403); echo json_encode(['error'=>'Owner access only.']); exit; }
        $in = json_input(); $id=(int)($in['id'] ?? 0); $status=trim((string)($in['status'] ?? ''));
        $allowed=['pending','confirmed','completed','cancelled'];
        if(!$id || !in_array($status,$allowed,true)){http_response_code(422);echo json_encode(['error'=>'Invalid reservation status.']);exit;}
        $stmt=$pdo->prepare('UPDATE appointments SET status=? WHERE id=?'); $stmt->execute([$status,$id]);
        echo json_encode(['ok'=>true,'status'=>$status]); exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed.']);
        exit;
    }

    $in = json_input();
    $serviceId = (int)($in['service_id'] ?? 0);
    $branch = trim($in['branch'] ?? '');
    $date = trim($in['appointment_date'] ?? '');
    $time = trim($in['appointment_time'] ?? '');
    $name = trim($in['customer_name'] ?? '');
    $email = trim(strtolower($in['email'] ?? ''));
    $phone = trim($in['phone'] ?? '');
    $petName = trim($in['pet_name'] ?? '');
    $petType = trim($in['pet_type'] ?? '');
    $petAge = trim($in['pet_age'] ?? '');
    $notes = trim($in['notes'] ?? '');

    if (!$serviceId || !$branch || !$date || !$time || !$name || !$email || !$phone || !$petName || !$petType) {
        http_response_code(422);
        echo json_encode(['error' => 'Please complete all required appointment fields.']);
        exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);
        echo json_encode(['error' => 'Please enter a valid email address.']);
        exit;
    }
    $d = DateTime::createFromFormat('Y-m-d', $date);
    $t = DateTime::createFromFormat('H:i:s', $time);
    if (!$d || $d->format('Y-m-d') !== $date || !$t || $t->format('H:i:s') !== $time) {
        http_response_code(422);
        echo json_encode(['error' => 'Please choose a valid appointment date and time.']);
        exit;
    }
    if ($date < date('Y-m-d')) {
        http_response_code(422);
        echo json_encode(['error' => 'Appointment date cannot be in the past.']);
        exit;
    }
    if ((int)$t->format('H') < 9 || (int)$t->format('H') > 18) {
        http_response_code(422);
        echo json_encode(['error' => 'Please choose a time between 9:00 AM and 6:00 PM.']);
        exit;
    }
    if (mb_strlen($name) > 120 || mb_strlen($branch) > 190 || mb_strlen($phone) > 30 || mb_strlen($petName) > 100 || mb_strlen($notes) > 1000) {
        http_response_code(422);
        echo json_encode(['error' => 'One or more fields are too long.']);
        exit;
    }

    $serviceStmt = $pdo->prepare('SELECT id, name FROM services WHERE id = ?');
    $serviceStmt->execute([$serviceId]);
    $service = $serviceStmt->fetch();
    if (!$service) {
        http_response_code(422);
        echo json_encode(['error' => 'Selected service is not available.']);
        exit;
    }

    // One appointment slot per branch/time. This prevents two customers from taking the same slot.
    $slot = $pdo->prepare("SELECT id FROM appointments WHERE branch = ? AND appointment_date = ? AND appointment_time = ? AND status IN ('pending','confirmed') LIMIT 1");
    $slot->execute([$branch, $date, $time]);
    if ($slot->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'That time slot is already reserved at this branch. Please choose another time.']);
        exit;
    }

    $user = current_user();
    $userId = $user['id'] ?? null;
    $stmt = $pdo->prepare('INSERT INTO appointments (user_id, service_id, branch, appointment_date, appointment_time, customer_name, email, phone, pet_name, pet_type, pet_age, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, \'pending\') RETURNING id');
    $stmt->execute([$userId, $serviceId, $branch, $date, $time, $name, $email, $phone, $petName, $petType, $petAge ?: null, $notes ?: null]);
    $id = (int)$stmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'appointment' => [
            'id' => $id,
            'reference' => 'PC-' . str_pad((string)$id, 6, '0', STR_PAD_LEFT),
            'service' => $service['name'],
            'branch' => $branch,
            'date' => $date,
            'time' => $time,
            'status' => 'pending'
        ]
    ]);
} catch (PDOException $e) {
    if (($e->errorInfo[0] ?? '') === '23505') {
        http_response_code(409);
        echo json_encode(['error' => 'That appointment slot was just taken. Please choose another time.']);
        exit;
    }
    error_log('Appointment API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Unable to save the appointment right now. Please try again.']);
}
