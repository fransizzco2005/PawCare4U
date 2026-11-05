<?php
/**
 * Minimal PayMongo client — just the one call checkout.php needs:
 * creating a hosted "Payment Link" that supports cards, GCash and Maya.
 * Docs: https://developers.paymongo.com/reference/create-a-link
 */
require_once __DIR__ . '/../config.php';

function paymongo_create_link(float $amountPesos, string $description, string $referenceNumber): array {
    $ch = curl_init('https://api.paymongo.com/v1/links');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Basic ' . base64_encode(PAYMONGO_SECRET_KEY . ':'),
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'data' => [
                'attributes' => [
                    // PayMongo amounts are in centavos
                    'amount'      => (int) round($amountPesos * 100),
                    'description' => $description,
                    'remarks'     => $referenceNumber,
                ],
            ],
        ]),
    ]);
    $response = curl_exec($ch);
    $curlErr  = curl_error($ch);
    $status   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // The request itself failed (no internet, curl not enabled, SSL cert
    // issue -- all common on a fresh XAMPP install) -- fail with a clear
    // message instead of a confusing "trying to access array offset on
    // null" once we try to read $body below.
    if ($response === false) {
        throw new RuntimeException('Could not reach PayMongo: ' . ($curlErr ?: 'unknown network error.'));
    }

    $body = json_decode($response, true);
    if ($status >= 400) {
        throw new RuntimeException($body['errors'][0]['detail'] ?? 'PayMongo request failed.');
    }
    if (!isset($body['data'])) {
        throw new RuntimeException('Unexpected response from PayMongo.');
    }
    return $body['data']; // includes id, and attributes.checkout_url
}

function paymongo_retrieve_link(string $linkId): array {
    $ch = curl_init("https://api.paymongo.com/v1/links/$linkId");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Authorization: Basic ' . base64_encode(PAYMONGO_SECRET_KEY . ':')],
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true)['data'] ?? [];
}
