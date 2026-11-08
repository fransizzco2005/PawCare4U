<?php
require_once __DIR__ . '/includes/auth.php';
$user = require_login_page();

$orderId = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare(
    'SELECT o.*, a.full_name, a.line1, a.city, a.province, a.postal_code, a.phone
     FROM orders o JOIN addresses a ON a.id = o.address_id
     WHERE o.id = ? AND o.user_id = ?'
);
$stmt->execute([$orderId, $user['id']]);
$order = $stmt->fetch();
if (!$order) { http_response_code(404); die('Order not found.'); }

$items = $pdo->prepare('SELECT * FROM order_items WHERE order_id = ?');
$items->execute([$orderId]);
$items = $items->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Order confirmed — PawCare</title>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css" />
<style>
  .confirm-wrap{max-width:640px;margin:60px auto;padding:0 24px;text-align:center;}
  .confirm-wrap h1{font-size:1.9rem;margin-bottom:8px;}
  .confirm-card{background:#fff;border:1px solid var(--paw-line);border-radius:var(--radius-lg);padding:24px;text-align:left;margin-top:24px;}
  .confirm-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--paw-line);font-size:0.9rem;}
  .confirm-row:last-child{border-bottom:none;}
</style>
</head>
<body>
<div class="confirm-wrap">
  <div style="font-size:3rem;">🐾✅</div>
  <h1>Thanks, <?= htmlspecialchars($order['full_name']) ?>!</h1>
  <p style="color:var(--paw-muted)">Order #<?= $order['id'] ?> has been placed
    (<?= $order['payment_method'] === 'cod' ? 'Cash on Delivery' : strtoupper($order['payment_method']) ?> ·
    payment status: <strong><?= htmlspecialchars($order['payment_status']) ?></strong>).</p>

  <div class="confirm-card">
    <h3><?= ($order['fulfillment_method'] ?? 'delivery') === 'pickup' ? 'Store pickup' : 'Delivery address' ?></h3>
    <p><?= ($order['fulfillment_method'] ?? 'delivery') === 'pickup'
        ? htmlspecialchars($order['pickup_branch'] ?? $order['city'])
        : htmlspecialchars($order['line1']) . ', ' . htmlspecialchars($order['city']) . ', ' . htmlspecialchars($order['province']) . ' ' . htmlspecialchars($order['postal_code']) ?><br>
       📞 <?= htmlspecialchars($order['phone']) ?></p>
  </div>

  <div class="confirm-card">
    <h3>Items</h3>
    <?php foreach ($items as $it): ?>
      <div class="confirm-row"><span><?= htmlspecialchars($it['name_snapshot']) ?> × <?= $it['qty'] ?></span>
        <span>€<?= number_format($it['price_snapshot'] * $it['qty'], 2) ?></span></div>
    <?php endforeach; ?>
    <div class="confirm-row"><span>Shipping</span><span>€<?= number_format($order['shipping_fee'], 2) ?></span></div>
    <div class="confirm-row"><strong>Total</strong><strong>€<?= number_format($order['total'], 2) ?></strong></div>
  </div>

  <a href="index.html" class="btn-primary" style="display:inline-block;margin-top:24px;">Continue shopping →</a>
</div>
</body>
</html>
