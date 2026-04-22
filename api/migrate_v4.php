<?php
require_once 'config/db.php';

try {
    // Add prodi and class_code to users table
    $sql = "ALTER TABLE users 
            ADD COLUMN prodi VARCHAR(100) NULL AFTER fakultas,
            ADD COLUMN class_code VARCHAR(50) NULL AFTER prodi";
    
    $pdo->exec($sql);
    echo "Migration Success: prodi and class_code added to users table.\n";
} catch (PDOException $e) {
    echo "Migration Error: " . $e->getMessage() . "\n";
}
?>
