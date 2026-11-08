<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/cancellation.php';
header('Content-Type: application/json; charset=utf-8');

$user = current_user();
if (!$user) { http_response_code(401); die(json_encode(['error'=>'Please sign in first.'])); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); die(json_encode(['error'=>'Method not allowed.'])); }
$input = json_input();
$appointmentId = (int)($input['id'] ?? 0);
try {
    $reason = pawcare_cancellation_reason($input, $user['role']);
} catch (InvalidArgumentException $e) {
    http_response_code(422); die(json_encode(['error'=>$e->getMessage()]));
}
if (!$appointmentId) { http_response_code(422); die(json_encode(['error'=>'Reservation is required.'])); }

$pdo->beginTransaction();
try {
    $select = $user['role'] === 'owner'
        ? $pdo->prepare('SELECT status FROM appointments WHERE id=? FOR UPDATE')
        : $pdo->prepare('SELECT status FROM appointments WHERE id=? AND user_id=? FOR UPDATE');
    $user['role'] === 'owner' ? $select->execute([$appointmentId]) : $select->execute([$appointmentId,$user['id']]);
    $status = $select->fetchColumn();
    if ($status === false) throw new DomainException('Reservation not found.');
    if ($status === 'cancelled') throw new DomainException('This reservation is already cancelled.');
    if ($user['role'] !== 'owner' && !in_array($status, ['pending','confirmed'], true)) {
        throw new DomainException('Only pending or confirmed reservations can be cancelled.');
    }
    $pdo->prepare("UPDATE appointments SET status='cancelled',cancellation_reason=? WHERE id=?")->execute([$reason,$appointmentId]);
    $pdo->commit();
    echo json_encode(['ok'=>true,'status'=>'cancelled','reason'=>$reason]);
} catch (DomainException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code($e->getMessage()==='Reservation not found.'?404:409);
    echo json_encode(['error'=>$e->getMessage()]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Reservation cancellation failed: '.$e->getMessage());
    http_response_code(500); echo json_encode(['error'=>'Could not cancel this reservation. Please try again.']);
}
