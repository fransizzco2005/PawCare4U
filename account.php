<?php
require_once __DIR__ . '/includes/auth.php';
$user = current_user();
if (!$user) { header('Location: index.html#account'); exit; }
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>My Account · PawCare</title>
<link rel="stylesheet" href="styles-clean.css">
<link rel="stylesheet" href="account-features.css">
<link rel="stylesheet" href="account-page.css">
</head>
<body class="account-page <?= $user['role']==='owner' ? 'is-owner' : 'is-user' ?>">
<header class="account-topbar">
  <a class="account-brand" href="index.html"><span class="account-brand-mark paw-logo-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21c-3.5 0-7-2.2-7-5.4 0-2 1.7-3.1 3.4-3.9 1.4-.7 1.9-1.3 1.9-2.4 0-1 .8-1.8 1.7-1.8s1.7.8 1.7 1.8c0 1.1.5 1.7 1.9 2.4 1.7.8 3.4 1.9 3.4 3.9 0 3.2-3.5 5.4-7 5.4Z"/><circle cx="6" cy="7.5" r="2.1"/><circle cx="12" cy="4.6" r="2.1"/><circle cx="18" cy="7.5" r="2.1"/><circle cx="3.4" cy="12.4" r="1.8"/></svg></span><span>PawCare</span></a>
  <nav class="account-topnav" aria-label="Account navigation">
    <a href="index.html">Home</a><a href="Dogs.html">Products</a><a href="services.html">Services</a>
  </nav>
  <div class="account-top-actions"><span class="role-chip"><?= $user['role']==='owner' ? '👑 OWNER' : '● USER' ?></span><a href="index.html" class="back-home">Back to PawCare</a></div>
</header>

<main class="account-shell">
  <div class="account-breadcrumb"><a href="index.html">PawCare</a><span>›</span><b>My Account</b></div>
  <section class="account-layout">
    <aside class="account-sidebar">
      <div class="profile-mini">
        <div class="avatar avatar-mini" id="miniAvatar"><span id="miniInitials">P</span><img id="miniAvatarImg" alt="Profile photo" hidden></div>
        <div><strong id="miniName">Loading...</strong><small id="miniEmail"></small></div>
      </div>
      <div class="sidebar-role"><?= $user['role']==='owner' ? '👑 OWNER ACCOUNT' : 'USER ACCOUNT' ?></div>
      <button class="side-link active" data-section="profile">👤 <span>Profile</span></button>
      <button class="side-link" data-section="orders">📦 <span><?= $user['role']==='owner' ? 'Orders' : 'My Orders' ?></span></button>
      <button class="side-link" data-section="reservations">🗓️ <span><?= $user['role']==='owner' ? 'Reservations' : 'My Reservations' ?></span></button>
      <?php if ($user['role']==='owner'): ?>
        <button class="side-link" data-section="feedback">💬 <span>Customer Feedback</span></button>
        <button class="side-link" data-section="overview">📊 <span>Overview</span></button>
      <?php endif; ?>
      <button class="side-link" id="signOutAccount">↪ <span>Sign out</span></button>
    </aside>

    <section class="account-content">
      <div class="account-heading">
        <div><span class="section-kicker"><?= $user['role']==='owner' ? 'OWNER SPACE' : 'MY ACCOUNT' ?></span><h1 id="accountTitle">Profile</h1><p id="accountSubtitle">Manage your PawCare profile and keep track of your orders.</p></div>
        <span class="big-role-indicator"><?= $user['role']==='owner' ? '👑 OWNER MODE' : '● CUSTOMER' ?></span>
      </div>

      <section class="account-section active" id="section-profile">
        <div class="profile-card">
          <div class="profile-card-top">
            <div class="profile-avatar-wrap"><div class="avatar avatar-large" id="profileAvatar"><span id="profileInitials">P</span><img id="profileAvatarImg" alt="Profile photo" hidden></div><label class="photo-btn" for="avatarInput">Change photo</label><input id="avatarInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden></div>
            <div><span class="hello-label">Hello,</span><h2 id="profileHello">PawCare user!</h2><p id="profileRoleText">Your account information</p></div>
          </div>
          <form id="profileForm" class="profile-form" enctype="multipart/form-data">
            <div class="form-grid">
              <label>Profile name / nickname<input id="nicknameInput" name="nickname" maxlength="80" placeholder="Enter your nickname"></label>
              <label>Username / full name<input id="fullNameInput" name="name" readonly></label>
              <label>Email<input id="emailInput" readonly></label>
              <label>Phone number<input id="phoneInput" readonly></label>
            </div>
            <div class="profile-note">You can change your <b>nickname</b> and profile photo. Your username/login email stays the same.</div>
            <div class="profile-actions"><button class="save-profile" type="submit">Save changes</button><span id="profileMessage"></span></div>
          </form>
        </div>
      </section>

      <section class="account-section" id="section-orders"><div id="accountOrders" class="account-orders-grid"><div class="account-loading">Loading orders...</div></div></section>
      <section class="account-section" id="section-reservations"><div id="accountReservations" class="account-reservations-grid"><div class="account-loading">Loading reservations...</div></div></section>
      <?php if ($user['role']==='owner'): ?>
      <section class="account-section" id="section-feedback"><div id="accountFeedback"><div class="account-loading">Loading feedback...</div></div></section>
      <section class="account-section" id="section-overview"><div id="accountOverview"><div class="account-loading">Loading overview...</div></div></section>
      <?php endif; ?>
    </section>
  </section>
</main>
<script src="account-page.js"></script>
</body></html>
