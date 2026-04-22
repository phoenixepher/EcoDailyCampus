<?php
/**
 * API Endpoint: Wishlist Management
 */
require_once 'config/db.php';

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

session_start();

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true) ?? $_POST;

try {
    if ($method === 'GET') {
        $userId = $_GET['user_id'] ?? 0;
        
        $sql = "SELECT w.id, w.product_id, p.name, p.price, p.stock, 
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
                FROM wishlist w
                JOIN products p ON w.product_id = p.id
                WHERE w.user_id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'items' => $items]);

    } elseif ($method === 'POST') {
        $action = $data['action'] ?? '';
        $userId = $data['user_id'] ?? ($_SESSION['user_id'] ?? 0);
        $productId = $data['product_id'] ?? 0;
        
        if ($action === 'toggle') {
            // Check if exists
            $check = $pdo->prepare("SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?");
            $check->execute([$userId, $productId]);
            
            if ($check->rowCount() > 0) {
                $pdo->prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?")->execute([$userId, $productId]);
                echo json_encode(['success' => true, 'action' => 'removed']);
            } else {
                $pdo->prepare("INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)")->execute([$userId, $productId]);
                echo json_encode(['success' => true, 'action' => 'added']);
            }
        }
        
        elseif ($action === 'remove') {
            $pdo->prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?")->execute([$userId, $productId]);
            echo json_encode(['success' => true]);
        }
        
        elseif ($action === 'move_to_cart') {
            $pdo->beginTransaction();
            // 1. Add to cart
            $sqlCart = "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1";
            $pdo->prepare($sqlCart)->execute([$userId, $productId]);
            // 2. Remove from wishlist
            $pdo->prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?")->execute([$userId, $productId]);
            $pdo->commit();
            echo json_encode(['success' => true]);
        }
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
