<?php
/**
 * API Endpoint: Shopping Cart Management
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

// --- Security Priority: session_id > data_id ---
$sessionUserId = $_SESSION['user_id'] ?? 0;
$passedUserId = $data['user_id'] ?? ($_GET['user_id'] ?? 0);
$userId = $sessionUserId ?: $passedUserId;

// Basic Auth Check: Ensure session matches or fallback if not available (development)
// In production, we should strictly check $_SESSION['user_id']
if (isset($_SESSION['user_id']) && $userId != $_SESSION['user_id']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access to this cart.']);
    exit();
}

try {
    if ($method === 'GET') {
        if (!$userId) {
            echo json_encode(['success' => false, 'message' => 'User ID is required']);
            exit();
        }
        
        $sql = "SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.stock, 
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
                FROM cart c
                JOIN products p ON c.product_id = p.id
                WHERE c.user_id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'items' => $items]);

    } elseif ($method === 'POST') {
        $action = $data['action'] ?? '';
        $productId = $data['product_id'] ?? 0;
        
        if (!$userId || !$productId) {
            echo json_encode(['success' => false, 'message' => 'Missing User ID or Product ID']);
            exit();
        }

        // Action: Add to Cart
        if ($action === 'add') {
            $qty = (int)($data['quantity'] ?? 1);
            
            // Debugging / Pre-check: Verify product exists and has stock
            $pCheck = $pdo->prepare("SELECT stock FROM products WHERE id = ?");
            $pCheck->execute([$productId]);
            $product = $pCheck->fetch();

            if (!$product) {
                echo json_encode(['success' => false, 'message' => 'Product does not exist']);
                exit();
            }

            if ($product['stock'] < $qty) {
                echo json_encode(['success' => false, 'message' => 'Not enough stock available']);
                exit();
            }

            $sql = "INSERT INTO cart (user_id, product_id, quantity) 
                    VALUES (?, ?, ?) 
                    ON DUPLICATE KEY UPDATE quantity = quantity + ?";
            $pdo->prepare($sql)->execute([$userId, $productId, $qty, $qty]);
            
            echo json_encode(['success' => true, 'message' => 'Item successfully added to cart']);
        }
        
        // Action: Update Quantity
        elseif ($action === 'update') {
            $qty = (int)($data['quantity'] ?? 1);
            if ($qty <= 0) {
                $pdo->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ?")->execute([$userId, $productId]);
            } else {
                $pdo->prepare("UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?")->execute([$qty, $userId, $productId]);
            }
            echo json_encode(['success' => true, 'message' => 'Cart updated']);
        }
        
        // Action: Remove Item
        elseif ($action === 'remove') {
            $pdo->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ?")->execute([$userId, $productId]);
            echo json_encode(['success' => true, 'message' => 'Item removed']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()]);
}
