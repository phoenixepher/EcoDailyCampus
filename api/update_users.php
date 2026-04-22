<?php
require_once 'config/db.php';

try {
    // Add avatar column to users table
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) DEFAULT NULL AFTER email");
    echo "Users table updated with avatar column!\n";
} catch (Exception $e) {
    echo "Update failed: " . $e->getMessage() . "\n";
}
?>
