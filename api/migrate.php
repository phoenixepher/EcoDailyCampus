<?php
require_once 'config/db.php';

try {
    // 1. Add waste_saved to challenges table
    $pdo->exec("ALTER TABLE challenges ADD COLUMN IF NOT EXISTS waste_saved DECIMAL(10,2) DEFAULT 0.00 AFTER reward_points");
    
    // 2. Add waste_saved and eco_points to users table
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS eco_points INT DEFAULT 0");
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS waste_saved DECIMAL(10,2) DEFAULT 0.00");

    echo "Database migrated successfully!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
