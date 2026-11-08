<?php

function pawcare_cancellation_reason(array $input, string $role): string
{
    $reasons = [
        'found_another_product' => 'I found another product',
        'ordered_by_mistake' => 'I ordered by mistake',
        'changed_my_mind' => 'I changed my mind',
        'delivery_takes_too_long' => 'The delivery takes too long',
        'other' => 'Other',
    ];
    if ($role === 'owner') {
        $reasons['owner_cancelled'] = 'Cancelled by the owner';
    }

    $code = trim((string)($input['reason'] ?? ''));
    if (!isset($reasons[$code])) {
        throw new InvalidArgumentException('Choose a cancellation reason.');
    }
    if ($code !== 'other') {
        return $reasons[$code];
    }

    $other = trim((string)($input['other_reason'] ?? ''));
    if (!$other || mb_strlen($other) > 300) {
        throw new InvalidArgumentException('Enter a cancellation reason (up to 300 characters).');
    }
    return 'Other: ' . $other;
}
