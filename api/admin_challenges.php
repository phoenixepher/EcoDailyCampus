<?php
/**
 * API Endpoint: Admin Challenge Verification (Legacy Functional Version)
 */
require_once 'config/db.php';

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

session_start();

// Security Check
if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

try {
    $stmt = $pdo->query("SELECT s.*, c.title as challenge_title, c.reward_points, u.name as user_name 
                         FROM challenge_submissions s 
                         JOIN challenges c ON s.challenge_id = c.id 
                         JOIN users u ON s.user_id = u.id 
                         WHERE s.status = 'pending' 
                         ORDER BY s.created_at ASC");
    $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'submissions' => $submissions]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
