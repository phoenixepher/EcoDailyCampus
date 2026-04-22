<?php
/**
 * API Endpoint: Shipping Address Management
 */
require_once 'config/db.php';

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

session_start();
$userId = $_SESSION['user_id'] ?? null;

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// Helper to get raw JSON data
$data = json_decode(file_get_contents('php://input'), true);

try {
    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC");
        $stmt->execute([$userId]);
        echo json_encode(['success' => true, 'addresses' => $stmt->fetchAll()]);
    } 
    else if ($method === 'POST') {
        $action = $_POST['action'] ?? ($data['action'] ?? 'add');
        
        if ($action === 'add') {
            $name = $data['name'] ?? '';
            $phone = $data['phone'] ?? '';
            $address = $data['address'] ?? '';
            $is_default = $data['is_default'] ? 1 : 0;

            if (empty($name) || empty($phone) || empty($address)) {
                throw new Exception('Semua field harus diisi');
            }

            // If this is the first address, make it default automatically
            $countStmt = $pdo->prepare("SELECT COUNT(*) FROM user_addresses WHERE user_id = ?");
            $countStmt->execute([$userId]);
            if ($countStmt->fetchColumn() == 0) {
                $is_default = 1;
            }

            // If setting as default, unset others
            if ($is_default) {
                $pdo->prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?")->execute([$userId]);
            }

            $stmt = $pdo->prepare("INSERT INTO user_addresses (user_id, name, phone, address, is_default) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$userId, $name, $phone, $address, $is_default]);
            
            echo json_encode(['success' => true, 'message' => 'Alamat berhasil ditambahkan']);
        }
        else if ($action === 'set_default') {
            $addressId = $data['id'] ?? null;
            if (!$addressId) throw new Exception('ID Alamat tidak valid');

            $pdo->beginTransaction();
            $pdo->prepare("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?")->execute([$userId]);
            $pdo->prepare("UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?")->execute([$addressId, $userId]);
            $pdo->commit();

            echo json_encode(['success' => true, 'message' => 'Alamat utama diperbarui']);
        }
        else if ($action === 'delete') {
            $addressId = $data['id'] ?? null;
            if (!$addressId) throw new Exception('ID Alamat tidak valid');

            $stmt = $pdo->prepare("DELETE FROM user_addresses WHERE id = ? AND user_id = ?");
            $stmt->execute([$addressId, $userId]);

            echo json_encode(['success' => true, 'message' => 'Alamat berhasil dihapus']);
        }
    }
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
