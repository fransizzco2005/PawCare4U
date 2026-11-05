<?php
/**
 * PawCare — global config.
 * Fill these in for your local / live environment.
 * NEVER commit real secret keys to a public repo.
 */

// --- Database ---
define('DB_HOST', 'localhost');
define('DB_NAME', 'pawcare');
define('DB_USER', 'root');
define('DB_PASS', '');

// --- PayMongo (Philippines: cards, GCash, Maya) ---
// Get these from https://dashboard.paymongo.com/developers  (start in TEST mode)
define('PAYMONGO_SECRET_KEY', 'sk_test_REPLACE_ME');
define('PAYMONGO_PUBLIC_KEY', 'pk_test_REPLACE_ME');

// Where PayMongo should send the shopper back to after paying
define('APP_BASE_URL', 'http://localhost/pawcare-php-sana');

// --- Error visibility ---
// IMPORTANT: display_errors must stay OFF for every api/*.php file. If it's
// on and PHP prints so much as a warning or a deprecation notice, that text
// gets printed into the response BEFORE the JSON body -- which silently
// breaks every fetch().json() call on the front end (login, session check,
// cart, checkout all use this). That's a very likely cause of "I made an
// account but it still shows me as signed out": PHP throwing a harmless
// notice and corrupting the response, invisibly.
// Errors are still fully captured -- just to a log file instead of the
// browser -- so nothing is hidden, it's just not breaking JSON anymore.
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');
error_reporting(E_ALL);

// --- Session ---
// Set cookie params explicitly BEFORE session_start(), so the session
// cookie behaves identically no matter what the machine's php.ini
// defaults happen to be. path=/ means the cookie is sent from every
// page in this project (index.html, Dogs.html, api/*.php, etc.) --
// if this were ever narrower, pages outside that path would silently
// never see you as logged in.
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,        // expires when the browser closes
        'path'     => '/',
        'domain'   => '',       // current host only
        'secure'   => false,    // set true once you're serving over HTTPS
        'httponly' => true,     // JS can't read the session cookie (XSS hardening)
        'samesite' => 'Lax',
    ]);
    session_start();
}

// NOTE: no blanket `header('Content-Type: ...')` here on purpose.
// Every api/*.php file already sets its own `Content-Type: application/json`
// right after including this file, and order_confirmation.php is a real
// HTML page. Forcing text/html here for everyone was harmless in most
// setups but is unnecessary and easy to trip over, so it's removed.
