<?php
/**
 * API Endpoint: Order Management (Checkout & Tracking)
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

// Prioritize Session ID for Security
$userId = $_SESSION['user_id'] ?? ($data['user_id'] ?? ($_GET['user_id'] ?? 0));

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit();
}

try {
    if ($method === 'GET') {
        $orderId = $_GET['order_id'] ?? null;
        $isAdminRequest = isset($_GET['admin_view']) && ($_SESSION['user_role'] ?? '') === 'admin';
        
        if ($orderId) {
            // Detail with admin override
            if ($isAdminRequest) {
                $stmt = $pdo->prepare("SELECT o.*, u.name as customer_name, u.email as customer_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?");
                $stmt->execute([$orderId]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?");
                $stmt->execute([$orderId, $userId]);
            }
            $order = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($order) {
                $stmtItems = $pdo->prepare("SELECT oi.*, p.name, 
                            (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
                            FROM order_items oi 
                            JOIN products p ON oi.product_id = p.id 
                            WHERE oi.order_id = ?");
                $stmtItems->execute([$orderId]);
                $order['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'order' => $order]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Order not found']);
            }
        } else {
            if ($isAdminRequest) {
                try {
                    $stmt = $pdo->prepare("SELECT o.*, u.name as customer_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC");
                    $stmt->execute();
                } catch (Exception $e) {
                    error_log("Admin View Orders Error: " . $e->getMessage());
                    throw $e;
                }
            } else {
                $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
                $stmt->execute([$userId]);
            }
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'orders' => $orders]);
        }

    } elseif ($method === 'POST') {
        $action = $data['action'] ?? '';
        $userId = $data['user_id'] ?? 0;
        
        if ($action === 'checkout') {
            $pdo->beginTransaction();
            
            // 1. Get Cart Items
            $stmtCart = $pdo->prepare("SELECT c.product_id, c.quantity, p.price 
                                     FROM cart c JOIN products p ON c.product_id = p.id 
                                     WHERE c.user_id = ?");
            $stmtCart->execute([$userId]);
            $cartItems = $stmtCart->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($cartItems)) {
                throw new Exception("Cart is empty");
            }
            
            $totalAmount = 0;
            foreach ($cartItems as $item) {
                $totalAmount += $item['price'] * $item['quantity'];
            }
            
            // 2. Create Order
            $sqlOrder = "INSERT INTO orders (user_id, total_amount, shipping_name, shipping_address, shipping_phone) 
                         VALUES (?, ?, ?, ?, ?)";
            $stmtOrder = $pdo->prepare($sqlOrder);
            $stmtOrder->execute([
                $userId, 
                $totalAmount, 
                $data['name'] ?? '', 
                $data['address'] ?? '', 
                $data['phone'] ?? ''
            ]);
            $newOrderId = $pdo->lastInsertId();
            
            // 3. Create Order Items & Update Stock
            $sqlItem = "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)";
            $stmtItem = $pdo->prepare($sqlItem);
            
            $sqlUpdateStock = "UPDATE products SET stock = stock - ? WHERE id = ?";
            $stmtUpdateStock = $pdo->prepare($sqlUpdateStock);
            
            foreach ($cartItems as $item) {
                $stmtItem->execute([$newOrderId, $item['product_id'], $item['quantity'], $item['price']]);
                $stmtUpdateStock->execute([$item['quantity'], $item['product_id']]);
            }
            
            // 4. Clear Cart
            $pdo->prepare("DELETE FROM cart WHERE user_id = ?")->execute([$userId]);
            
            $pdo->commit();
            echo json_encode(['success' => true, 'order_id' => $newOrderId]);
        }
        
        elseif ($action === 'update_status' && isset($data['order_id']) && isset($data['status'])) {
            // This would be for Admin
            $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?")->execute([$data['status'], $data['order_id']]);
            echo json_encode(['success' => true]);
        }
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
