<?php
require_once __DIR__ . '/includes/auth.php';
$owner=current_owner();
if(!$owner){ header('Location: index.html#account'); exit; }
?>
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Owner Dashboard | PawCare</title><link rel="stylesheet" href="styles-clean.css"><link rel="stylesheet" href="account-features.css"></head>
<body class="owner-page">
<header class="owner-header"><a href="index.html" class="owner-brand">🐾 PawCare <span>OWNER</span></a><div class="owner-header-right"><span>Signed in as <?=htmlspecialchars($owner['name'])?></span><button id="ownerLogout" class="owner-logout">Sign out</button></div></header>
<main class="owner-main">
  <section class="owner-hero"><div><span class="owner-kicker">OWNER CONTROL PANEL</span><h1>Store Dashboard</h1><p>Manage orders, product messages, inventory, and store performance.</p></div><span class="owner-badge">● OWNER ACCOUNT</span></section>
  <nav class="owner-tabs"><button class="owner-tab active" data-tab="orders">📦 Orders</button><button class="owner-tab" data-tab="messages">💬 Messages <span class="owner-message-badge" id="ownerMessageBadge" hidden>0</span></button><button class="owner-tab" data-tab="inventory">🛍️ Inventory</button><button class="owner-tab" data-tab="feedback">⭐ Feedback</button><button class="owner-tab" data-tab="overview">📊 Overview</button></nav>
  <section id="ownerOrdersPanel" class="owner-panel"></section>
  <section id="ownerMessagesPanel" class="owner-panel" hidden><div class="product-messages-layout"><div id="ownerConversationList" class="product-conversation-list"></div><div id="ownerConversationThread" class="product-conversation-thread"><div class="account-loading">Select a conversation to view messages.</div></div></div></section>
  <section id="ownerInventoryPanel" class="owner-panel" hidden></section>
  <section id="ownerFeedbackPanel" class="owner-panel" hidden></section>
  <section id="ownerOverviewPanel" class="owner-panel" hidden></section>
</main>
<script src="account-features.js"></script><script>window.PawCareOwner?.init();</script>
</body></html>