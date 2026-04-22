<?php
require_once 'config/db.php';

try {
    // Add bio and fakultas columns to users table
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL AFTER avatar");
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS fakultas VARCHAR(100) DEFAULT NULL AFTER bio");
    
    echo "Database migrated: added bio and fakultas to users table.\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
