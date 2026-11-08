<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json; charset=utf-8');

$owner = current_owner();
if (!$owner) { http_response_code(403); die(json_encode(['error'=>'Owner access only.'])); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); die(json_encode(['error'=>'Method not allowed.'])); }

$input = json_input();
$type = $input['type'] ?? '';
$action = $input['action'] ?? '';
$id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
$tables = ['order' => 'orders', 'reservation' => 'appointments'];
if (!isset($tables[$type]) || !in_array($action, ['archive','restore','delete'], true) || !$id || $id < 1) {
    http_response_code(422);
    die(json_encode(['error'=>'Choose a valid order or reservation action.']));
}

$table = $tables[$type];
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare("SELECT archived_at FROM {$table} WHERE id=? FOR UPDATE");
    $stmt->execute([$id]);
    $archivedAt = $stmt->fetchColumn();
    if ($archivedAt === false) throw new DomainException(ucfirst($type).' not found.');

    if ($action === 'archive') {
        if ($archivedAt !== null) throw new DomainException('This record is already in the trash.');
        $pdo->prepare("UPDATE {$table} SET archived_at=CURRENT_TIMESTAMP WHERE id=?")->execute([$id]);
    } elseif ($action === 'restore') {
        if ($archivedAt === null) throw new DomainException('This record is not in the trash.');
        $pdo->prepare("UPDATE {$table} SET archived_at=NULL WHERE id=?")->execute([$id]);
    } else {
        if ($archivedAt === null) throw new DomainException('Move this record to the trash before permanently deleting it.');
        $pdo->prepare("DELETE FROM {$table} WHERE id=? AND archived_at IS NOT NULL")->execute([$id]);
    }

    $pdo->commit();
    echo json_encode(['ok'=>true,'action'=>$action,'type'=>$type,'id'=>$id]);
} catch (DomainException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    $notFound = str_ends_with($e->getMessage(), ' not found.');
    http_response_code($notFound ? 404 : 409);
    echo json_encode(['error'=>$e->getMessage()]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Owner record trash action failed: '.$e->getMessage());
    http_response_code(500);
    echo json_encode(['error'=>'Could not update this record. Please try again.']);
}
