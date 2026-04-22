<?php
require_once 'config/db.php';
$stmt = $pdo->query("DESCRIBE users");
echo json_encode($stmt->fetchAll());
?>
