<?php
/**
 * Database Connection - Cloud Hosting Ready (Vercel + Supabase)
 * Supports both PostgreSQL (Supabase) and MySQL (Local)
 */

// 1. Get database credentials from environment variables (standard for Hosting)
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_port = getenv('DB_PORT') ?: '3306';
$db_name = getenv('DB_NAME') ?: 'ecodaily_campus';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';
$db_type = getenv('DB_DRIVER') ?: 'mysql'; // Fallback to mysql for local development

try {
    if ($db_type === 'pgsql') {
        // Supabase / PostgreSQL Format
        $dsn = "pgsql:host=$db_host;port=$db_port;dbname=$db_name;options='--client_encoding=UTF8'";
    } else {
        // MySQL Local Format
        $dsn = "mysql:host=$db_host;port=$db_port;dbname=$db_name;charset=utf8mb4";
    }

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
} catch (PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Cloud Database Connection Failed: ' . $e->getMessage()
    ]);
    exit();
}
