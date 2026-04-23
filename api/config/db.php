<?php
/**
 * Ultimate Database Connection - Auto-Detection & Fallback
 * Didesain agar website TIDAK PERNAH error koneksi lagi.
 */

// 1. Kredensial Supabase (Cloud)
$cloud_host = 'db.lsalprhrxfvipbpwuhzg.supabase.co';
$cloud_name = 'postgres';
$cloud_user = 'postgres';
$cloud_pass = 'Pas5seCur312@';
$cloud_port = '5432';

// 2. Kredensial XAMPP (Localhost)
$local_host = 'localhost';
$local_name = 'ecodaily_campus';
$local_user = 'root';
$local_pass = '';

try {
    // COBA 1: Supabase (PostgreSQL)
    if (extension_loaded('pdo_pgsql')) {
        $dsn_cloud = "pgsql:host=$cloud_host;port=$cloud_port;dbname=$cloud_name;options='--client_encoding=UTF8'";
        $pdo = new PDO($dsn_cloud, $cloud_user, $cloud_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 3 // Timeout cepat jika internet lambat
        ]);
    } else {
        throw new Exception("Driver PGSQL missing");
    }
} catch (Exception $e) {
    // COBA 2: Fallback ke MySQL Lokal (XAMPP)
    try {
        $dsn_local = "mysql:host=$local_host;dbname=$local_name;charset=utf8mb4";
        $pdo = new PDO($dsn_local, $local_user, $local_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
    } catch (PDOException $e2) {
        // ERROR TERAKHIR: Berikan instruksi teknis yang sangat jelas
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Koneksi Gagal: Silakan pastikan MySQL di XAMPP sudah START.',
            'debug' => 'Cloud: ' . $e->getMessage() . ' | Local: ' . $e2->getMessage()
        ]);
        exit();
    }
}
