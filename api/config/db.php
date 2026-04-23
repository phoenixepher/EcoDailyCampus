<?php
/**
 * Professional Database Connection - Universal (Local & Cloud)
 * Supports Supabase (PostgreSQL) and XAMPP (MySQL)
 */

// 1. Ambil dari Environment Variables (Prioritas Utama untuk Vercel/Hosting)
$db_host = getenv('DB_HOST') ?: 'db.lsalprhrxfvipbpwuhzg.supabase.co';
$db_port = getenv('DB_PORT') ?: '5432';
$db_name = getenv('DB_NAME') ?: 'postgres';
$db_user = getenv('DB_USER') ?: 'postgres';
$db_pass = getenv('DB_PASS') ?: 'Pas5seCur312@';
$db_type = getenv('DB_DRIVER') ?: 'pgsql'; // Default pgsql untuk Supabase

try {
    if ($db_type === 'pgsql') {
        $dsn = "pgsql:host=$db_host;port=$db_port;dbname=$db_name;options='--client_encoding=UTF8'";
    } else {
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
    $errorMsg = $e->getMessage();
    $friendlyMsg = 'Database connection failed!';
    
    if (strpos($errorMsg, 'could not find driver') !== false) {
        $friendlyMsg = 'Error: Driver PostgreSQL (pdo_pgsql) tidak ditemukan di XAMPP Anda. Silakan aktifkan di php.ini.';
    }

    echo json_encode([
        'success' => false, 
        'message' => $friendlyMsg,
        'error' => $errorMsg
    ]);
    exit();
}
