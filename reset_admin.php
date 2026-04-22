<?php
require_once 'api/config/db.php';
$p = password_hash('admin123', PASSWORD_BCRYPT);
$pdo->prepare('UPDATE users SET password = ? WHERE email = ?')->execute([$p, 'admin@gmail.com']);
echo 'Admin password reset to: admin123';
