<?php
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');
$user = current_user();
if (!$user || $user['role'] !== 'owner') { http_response_code(403); die(json_encode(['error'=>'Owner access only.'])); }

$sales = $pdo->query(
    "SELECT COUNT(*) FILTER (WHERE order_status<>'cancelled')::int orders,
            COALESCE(SUM(total) FILTER (WHERE order_status<>'cancelled'),0) sales,
            COUNT(*) FILTER (WHERE order_status<>'cancelled' AND date_trunc('month',created_at)=date_trunc('month',NOW()))::int month_orders,
            COALESCE(SUM(total) FILTER (WHERE order_status<>'cancelled' AND date_trunc('month',created_at)=date_trunc('month',NOW())),0) month_sales
     FROM orders"
)->fetch();
$ratings = $pdo->query(
    "SELECT COUNT(*)::int count,COALESCE(AVG(rating),0)::numeric(3,2) average,
            COUNT(*) FILTER (WHERE date_trunc('month',created_at)=date_trunc('month',NOW()))::int month_count,
            COALESCE(AVG(rating) FILTER (WHERE date_trunc('month',created_at)=date_trunc('month',NOW())),0)::numeric(3,2) month_average
     FROM product_feedback WHERE user_id IS NOT NULL AND rating IS NOT NULL"
)->fetch();
$monthly = $pdo->query(
    "SELECT to_char(date_trunc('month',created_at),'YYYY-MM') month,
            COUNT(*) FILTER (WHERE order_status<>'cancelled')::int orders,
            COALESCE(SUM(total) FILTER (WHERE order_status<>'cancelled'),0) sales
     FROM orders GROUP BY date_trunc('month',created_at) ORDER BY date_trunc('month',created_at) DESC LIMIT 12"
)->fetchAll();
$monthlyRatings = $pdo->query(
    "SELECT to_char(date_trunc('month',created_at),'YYYY-MM') month,COUNT(*)::int count,
            COALESCE(AVG(rating),0)::numeric(3,2) average
     FROM product_feedback WHERE user_id IS NOT NULL AND rating IS NOT NULL
     GROUP BY date_trunc('month',created_at) ORDER BY date_trunc('month',created_at) DESC LIMIT 12"
)->fetchAll();
$years = $pdo->query("SELECT DISTINCT EXTRACT(YEAR FROM created_at)::int AS year FROM orders ORDER BY year DESC")->fetchAll(PDO::FETCH_COLUMN);
$year = filter_var($_GET['year'] ?? date('Y'), FILTER_VALIDATE_INT);
$month = filter_var($_GET['month'] ?? date('n'), FILTER_VALIDATE_INT);
if (!$year || $year < 2000 || $year > 9999 || !$month || $month < 1 || $month > 12) {
    http_response_code(422);
    die(json_encode(['error'=>'Choose a valid month and year.']));
}
$selectedMonth = $pdo->prepare(
    "SELECT COUNT(*) FILTER (WHERE order_status<>'cancelled')::int orders,
            COALESCE(SUM(total) FILTER (WHERE order_status<>'cancelled'),0) sales
     FROM orders
     WHERE EXTRACT(YEAR FROM created_at)=? AND EXTRACT(MONTH FROM created_at)=?"
);
$selectedMonth->execute([$year,$month]);
echo json_encode([
    'sales'=>$sales,
    'ratings'=>$ratings,
    'monthly'=>$monthly,
    'monthly_ratings'=>$monthlyRatings,
    'years'=>array_map('intval',$years),
    'selected_month'=>['year'=>$year,'month'=>$month]+$selectedMonth->fetch()
]);
