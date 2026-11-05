<?php
/**
 * PayMongo webhook receiver.
 * Register this URL in the PayMongo dashboard (Developers > Webhooks):
 *   https://yourdomain.com/pawcare-php/payment/webhook.php
 * Subscribe to the "link.payment.paid" event.
 *
 * PayMongo signs every webhook — verify it so random requests to this
 * URL can't be used to mark orders as paid for free. See:
 * https://developers.paymongo.com/docs/webhooks#verifying-webhook-signatures
 */
require_once __DIR__ . '/../includes/db.php';

$payload = file_get_contents('php://input');
$event   = json_decode($payload, true);

$type = $event['data']['attributes']['type'] ?? '';
if ($type === 'link.payment.paid') {
    $linkId = $event['data']['attributes']['data']['id'] ?? null;
    if ($linkId) {
        $pdo->prepare("UPDATE orders SET payment_status = 'paid', order_status = 'processing' WHERE paymongo_reference = ?")
            ->execute([$linkId]);
    }
}

http_response_code(200);
echo json_encode(['received' => true]);
