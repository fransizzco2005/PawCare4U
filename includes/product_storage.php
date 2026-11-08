<?php

function pawcare_upload_product_image(string $dataUrl): string
{
    if (!preg_match('/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+\/=]+)$/', $dataUrl, $matches)) {
        throw new InvalidArgumentException('Upload a JPG, PNG, or WEBP product image.');
    }

    $image = base64_decode($matches[2], true);
    if ($image === false || strlen($image) > 3 * 1024 * 1024 || @getimagesizefromstring($image) === false) {
        throw new InvalidArgumentException('Product images must be valid and no larger than 3 MB.');
    }

    $key = getenv('SUPABASE_SERVICE_ROLE_KEY') ?: getenv('SUPABASE_SECRET_KEY');
    if (!$key) {
        throw new RuntimeException('Product image storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.');
    }
    if (!function_exists('curl_init')) {
        throw new RuntimeException('Product image uploads require the PHP cURL extension.');
    }

    $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
    $path = 'products/' . bin2hex(random_bytes(16)) . '.' . $extension;
    $url = rtrim(SUPABASE_URL, '/') . '/storage/v1/object/product-images/' . $path;
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => $image,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $key,
            'Authorization: Bearer ' . $key,
            'Content-Type: image/' . ($matches[1] === 'jpeg' ? 'jpeg' : $matches[1]),
            'x-upsert: false',
        ],
        CURLOPT_TIMEOUT => 25,
    ]);
    $response = curl_exec($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    if ($response === false || $status < 200 || $status >= 300) {
        error_log('Product image storage upload failed: ' . ($error ?: 'HTTP ' . $status));
        throw new RuntimeException('Could not upload the product image. Please try again.');
    }

    return rtrim(SUPABASE_URL, '/') . '/storage/v1/object/public/product-images/' . $path;
}

function pawcare_delete_product_image(string $imageUrl): void
{
    $key = getenv('SUPABASE_SERVICE_ROLE_KEY') ?: getenv('SUPABASE_SECRET_KEY');
    $prefix = rtrim(SUPABASE_URL, '/') . '/storage/v1/object/public/product-images/';
    if (!$key || !str_starts_with($imageUrl, $prefix) || !function_exists('curl_init')) {
        return;
    }
    $path = substr($imageUrl, strlen($prefix));
    $curl = curl_init(rtrim(SUPABASE_URL, '/') . '/storage/v1/object/product-images/' . $path);
    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => 'DELETE',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['apikey: ' . $key, 'Authorization: Bearer ' . $key],
        CURLOPT_TIMEOUT => 15,
    ]);
    curl_exec($curl);
    curl_close($curl);
}
