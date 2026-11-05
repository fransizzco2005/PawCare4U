<?php
require_once __DIR__ . '/includes/auth.php';
require_login_page();
?>
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>My Orders | PawCare</title><link rel="stylesheet" href="styles-clean.css"><link rel="stylesheet" href="account-features.css"></head>
<body class="pawcare-orders-page">
<header class="orders-header"><a href="index.html" class="orders-logo">🐾 PawCare</a><a href="index.html">Back to shop</a></header>
<main class="orders-main"><div class="orders-title"><div><span class="eyebrow">MY ACCOUNT</span><h1>My Orders</h1><p>Track your orders from placed until delivered.</p></div></div><div id="ordersMessage" class="orders-message">Loading your orders...</div><div id="ordersList"></div></main>
<script src="account-features.js"></script><script>window.PawCareOrders?.initUserOrders();</script>
</body></html>