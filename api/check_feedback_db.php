<?php
require_once 'config/db.php';
echo "--- USERS ---\n";
$stmt = $pdo->query("DESCRIBE users");
print_r($stmt->fetchAll());
?>
