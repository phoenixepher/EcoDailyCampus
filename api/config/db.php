<?php
/**
 * Database Connection - Optimized for InfinityFree (MySQL)
 * Works perfectly on both Localhost (XAMPP) and InfinityFree.
 */

// 1. Database credentials
// On InfinityFree, you will get these from your Control Panel
$db_host = 'localhost';      // Localhost or InfinityFree MySQL Host
$db_name = 'ecodaily_campus'; // Your Database Name
$db_user = 'root';           // Your Database Username
$db_pass = '';               // Your Database Password

try {
    $dsn = "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4";
    
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $pdo = new PDO($dsn, $db_user, $db_pass, $options);

} catch (PDOException $e) {
    // Return professional JSON error if database connection fails
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Database connection failed. Please check your credentials.',
        'error' => $e->getMessage()
    ]);
    exit();
}
