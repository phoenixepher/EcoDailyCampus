<?php
/**
 * Professional Multi-Environment Database Connection
 * Otomatis mendeteksi antara Local (XAMPP) dan Production (InfinityFree)
 */

// 1. Deteksi apakah kita sedang di Localhost atau di Hosting
$is_localhost = ($_SERVER['REMOTE_ADDR'] === '127.0.0.1' || $_SERVER['REMOTE_ADDR'] === '::1' || $_SERVER['HTTP_HOST'] === 'localhost');

if ($is_localhost) {
    // === CONFIG LOCAL (XAMPP) ===
    $db_host = 'localhost';
    $db_name = 'ecodaily_campus';
    $db_user = 'root';
    $db_pass = '';
} else {
    // === CONFIG PRODUCTION (INFINITYFREE) ===
    // Silakan isi sesuai data dari Control Panel InfinityFree Anda
    $db_host = 'sqlXXX.infinityfree.com'; // Contoh: sql301.epizy.com
    $db_name = 'if0_XXXXXXXX_db';        // Nama Database di panel
    $db_user = 'if0_XXXXXXXX';           // Username Database
    $db_pass = 'MASUKKAN_PASSWORD_DISINI'; // Password akun InfinityFree
}

try {
    // Semua environment menggunakan MySQL
    $dsn = "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4";
    
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $pdo = new PDO($dsn, $db_user, $db_pass, $options);

} catch (PDOException $e) {
    // Jika gagal, tampilkan pesan error yang profesional
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Koneksi Database Gagal! Mohon cek kredensial di api/config/db.php',
        'debug' => $e->getMessage()
    ]);
    exit();
}
