<?php
require_once 'config/db.php';

echo "<h2>Database Diagnosis</h2>";
echo "DB Type: " . (getenv('DB_DRIVER') ?: 'pgsql') . "<br>";
echo "DB Host: " . (getenv('DB_HOST') ?: 'db.lsalprhrxfvipbpwuhzg.supabase.co') . "<br>";

try {
    if ($pdo) {
        echo "<h3 style='color:green'>SUCCESS: Connected to Database!</h3>";
        
        // Cek tabel users
        $stmt = $pdo->query("SELECT COUNT(*) FROM users");
        echo "Total Users in DB: " . $stmt->fetchColumn();
    }
} catch (Exception $e) {
    echo "<h3 style='color:red'>FAILED: " . $e->getMessage() . "</h3>";
    echo "<h4>Possible solutions:</h4>";
    echo "1. Pastikan ekstensi 'pdo_pgsql' aktif di php.ini XAMPP Anda.<br>";
    echo "2. Cek koneksi internet Anda (Supabase butuh internet).<br>";
    echo "3. Verifikasi Password di api/config/db.php.";
}
