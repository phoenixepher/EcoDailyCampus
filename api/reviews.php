<?php
/**
 * API Endpoint: Product Reviews
 * Handles fetching and submitting reviews with campus identity
 */
require_once 'config/db.php';

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $productId = $_GET['product_id'] ?? null;
        
        if ($productId) {
            $stmt = $pdo->prepare("SELECT r.*, p.name as product_name 
                                 FROM product_reviews r 
                                 JOIN products p ON r.product_id = p.id 
                                 WHERE r.product_id = ? 
                                 ORDER BY r.created_at DESC");
            $stmt->execute([$productId]);
        } else {
            // Admin view: Fetch all product reviews
            $stmt = $pdo->query("SELECT r.*, p.name as product_name 
                               FROM product_reviews r 
                               JOIN products p ON r.product_id = p.id 
                               ORDER BY r.created_at DESC");
        }
        
        $reviews = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'reviews' => $reviews
        ]);

    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // 1. Validation
        $productId = $input['product_id'] ?? null;
        $name = trim($input['name'] ?? '');
        $prodi = trim($input['prodi'] ?? '');
        $classCode = trim($input['class_code'] ?? '');
        $rating = (int)($input['rating'] ?? 0);
        $comment = trim($input['comment'] ?? '');

        if (!$productId || !$name || !$prodi || !$classCode || $rating < 1 || $rating > 5 || !$comment) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid or missing input data']);
            exit();
        }

        // 2. Prepared Statement to Save Data
        $sql = "INSERT INTO product_reviews (product_id, name, prodi, class_code, rating, comment) 
                VALUES (:product_id, :name, :prodi, :class_code, :rating, :comment)";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            ':product_id' => $productId,
            ':name' => $name,
            ':prodi' => $prodi,
            ':class_code' => $classCode,
            ':rating' => $rating,
            ':comment' => $comment
        ]);

        if ($result) {
            echo json_encode([
                'success' => true, 
                'message' => 'Review submitted successfully!',
                'review' => [
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
            throw new Exception("Failed to save review");
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
