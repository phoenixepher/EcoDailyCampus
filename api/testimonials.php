<?php
/**
 * API Endpoint: Site Testimonials
 * Handles fetching and submitting general website reviews
 */
require_once 'config/db.php';

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM site_testimonials ORDER BY created_at DESC");
        $testimonials = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'testimonials' => $testimonials
        ]);

    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // 1. Validation
        $name = trim($input['name'] ?? '');
        $prodi = trim($input['prodi'] ?? '');
        $classCode = trim($input['class_code'] ?? '');
        $rating = (int)($input['rating'] ?? 0);
        $comment = trim($input['comment'] ?? '');

        if (!$name || !$prodi || !$classCode || $rating < 1 || $rating > 5 || !$comment) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid or missing input data']);
            exit();
        }

        // 2. Prepared Statement to Save Data
        $sql = "INSERT INTO site_testimonials (name, prodi, class_code, rating, comment) 
                VALUES (:name, :prodi, :class_code, :rating, :comment)";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            ':name' => $name,
            ':prodi' => $prodi,
            ':class_code' => $classCode,
            ':rating' => $rating,
            ':comment' => $comment
        ]);

        if ($result) {
            echo json_encode([
                'success' => true, 
                'message' => 'Testimonial submitted successfully!',
                'testimonial' => [
                    'id' => $pdo->lastInsertId(),
                    'name' => $name,
                    'prodi' => $prodi,
                    'class_code' => $classCode,
                    'rating' => $rating,
                    'comment' => $comment,
                    'created_at' => date('Y-m-d H:i:s')
                ]
            ]);
        } else {
            throw new Exception("Failed to save testimonial");
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
