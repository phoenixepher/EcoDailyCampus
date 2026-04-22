<?php
/**
 * API Endpoint: Administrative Actions (CRUD)
 * Supports multiple product image uploads (max 5 per product)
 */
require_once 'config/db.php';

// 1. CORS Headers with Credentials support
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
header('Content-Type: application/json');

// Security Check: Admin Only
if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized Access: Admin privileges required.']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// ─────────────────────────────────────────────────────────────
// Helper: Save uploaded images and return array of saved paths
// ─────────────────────────────────────────────────────────────
function saveUploadedImages(string $inputName, string $uploadDir, int $maxFiles = 5): array {
    $saved = [];
    if (!isset($_FILES[$inputName])) return $saved;

    // Normalise to array regardless of single / multiple input
    $files = $_FILES[$inputName];
    if (!is_array($files['name'])) {
        // Single file wrapped as array
        $files = [
            'name'     => [$files['name']],
            'type'     => [$files['type']],
            'tmp_name' => [$files['tmp_name']],
            'error'    => [$files['error']],
            'size'     => [$files['size']],
        ];
    }

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    $count   = min(count($files['name']), $maxFiles);

    for ($i = 0; $i < $count; $i++) {
        if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;
        $ext = strtolower(pathinfo($files['name'][$i], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed)) continue;

        $filename   = uniqid('prod_') . '.' . $ext;
        $uploadFile = $uploadDir . $filename;

        if (move_uploaded_file($files['tmp_name'][$i], $uploadFile)) {
            chmod($uploadFile, 0644);
            $saved[] = 'uploads/' . $filename;   // relative path stored in DB
        }
    }
    return $saved;
}

// ─────────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (strpos($contentType, 'application/json') !== false) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
    } else {
        $data = $_POST;
    }

    $action = $data['action'] ?? '';

    // ── DELETE PRODUCT ────────────────────────────────────────
    if ($action === 'delete_product') {
        $id = (int)($data['id'] ?? 0);
        try {
            // Images are cascaded or deleted first
            $pdo->prepare("DELETE FROM product_images WHERE product_id = ?")->execute([$id]);
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit();
    }

    // ── ADD PRODUCT ───────────────────────────────────────────
    if ($action === 'add_product') {
        try {
            $pdo->beginTransaction();

            $catId       = isset($data['category_id']) ? (int)$data['category_id'] : 1;
            $name        = trim($data['name'] ?? 'Untitled Product');
            $price       = isset($data['price'])       ? (float)$data['price']       : 0.00;
            $stock       = isset($data['stock'])       ? (int)$data['stock']         : 0;
            $ecoPoints   = isset($data['eco_points'])  ? (int)$data['eco_points']    : 0;
            $description = trim($data['description']   ?? '');
            $slug        = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name))) . '-' . time();

            $stmt = $pdo->prepare(
                "INSERT INTO products (name, slug, description, price, stock, eco_points, category_id)
                 VALUES (:name, :slug, :desc, :price, :stock, :eco, :cat)"
            );
            $stmt->execute([
                'name'  => $name,
                'slug'  => $slug,
                'desc'  => $description,
                'price' => $price,
                'stock' => $stock,
                'eco'   => $ecoPoints,
                'cat'   => $catId,
            ]);
            $prodId = (int)$pdo->lastInsertId();

            // Handle image uploads (max 5)
            $uploadDir  = '../public/uploads/';
            $savedPaths = saveUploadedImages('images', $uploadDir, 5);

            // Default placeholder if no image uploaded
            if (empty($savedPaths)) {
                $savedPaths = ['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=500'];
            }

            $imgStmt = $pdo->prepare(
                "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)"
            );
            foreach ($savedPaths as $idx => $path) {
                $imgStmt->execute([$prodId, $path, ($idx === 0 ? 1 : 0)]);
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'id' => $prodId]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit();
    }

    // ── EDIT PRODUCT ──────────────────────────────────────────
    if ($action === 'edit_product') {
        try {
            $pdo->beginTransaction();

            $id          = (int)($data['id'] ?? 0);
            $catId       = isset($data['category_id']) ? (int)$data['category_id'] : 1;
            $name        = trim($data['name']        ?? '');
            $price       = isset($data['price'])       ? (float)$data['price']    : 0.00;
            $stock       = isset($data['stock'])       ? (int)$data['stock']      : 0;
            $ecoPoints   = isset($data['eco_points'])  ? (int)$data['eco_points'] : 0;
            $description = trim($data['description']   ?? '');

            $pdo->prepare(
                "UPDATE products SET name=:name, description=:desc, price=:price,
                 stock=:stock, eco_points=:eco, category_id=:cat WHERE id=:id"
            )->execute([
                'name'  => $name,
                'desc'  => $description,
                'price' => $price,
                'stock' => $stock,
                'eco'   => $ecoPoints,
                'cat'   => $catId,
                'id'    => $id,
            ]);

            // Handle new image uploads
            $uploadDir  = '../public/uploads/';
            $savedPaths = saveUploadedImages('images', $uploadDir, 5);

            if (!empty($savedPaths)) {
                // Check how many images already exist
                $countStmt = $pdo->prepare("SELECT COUNT(*) FROM product_images WHERE product_id = ?");
                $countStmt->execute([$id]);
                $existing = (int)$countStmt->fetchColumn();
                $remaining = 5 - $existing;

                if ($remaining > 0) {
                    $savedPaths = array_slice($savedPaths, 0, $remaining);
                    $imgStmt = $pdo->prepare(
                        "INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)"
                    );
                    foreach ($savedPaths as $idx => $path) {
                        $isPrimary = ($existing === 0 && $idx === 0) ? 1 : 0;
                        $imgStmt->execute([$id, $path, $isPrimary]);
                    }
                }
            }

            $pdo->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit();
    }

    // ── DELETE SINGLE PRODUCT IMAGE ───────────────────────────
    if ($action === 'delete_product_image') {
        $imageUrl  = $data['image_url']  ?? '';
        $productId = (int)($data['product_id'] ?? 0);
        try {
            $stmt = $pdo->prepare("DELETE FROM product_images WHERE product_id = ? AND image_url = ?");
            $stmt->execute([$productId, $imageUrl]);

            // If deleted was primary, promote next image to primary
            $check = $pdo->prepare("SELECT COUNT(*) FROM product_images WHERE product_id = ? AND is_primary = 1");
            $check->execute([$productId]);
            if ((int)$check->fetchColumn() === 0) {
                $promote = $pdo->prepare(
                    "UPDATE product_images SET is_primary = 1 WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1"
                );
                $promote->execute([$productId]);
            }

            // Delete physical file if stored locally
            if ($imageUrl && !str_starts_with($imageUrl, 'http')) {
                $filePath = '../public/' . ltrim($imageUrl, '/');
                if (file_exists($filePath)) unlink($filePath);
            }

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit();
    }

    // ── SET PRIMARY IMAGE ─────────────────────────────────────
    if ($action === 'set_primary_image') {
        $imageUrl  = $data['image_url']  ?? '';
        $productId = (int)($data['product_id'] ?? 0);
        try {
            $pdo->prepare("UPDATE product_images SET is_primary = 0 WHERE product_id = ?")->execute([$productId]);
            $pdo->prepare("UPDATE product_images SET is_primary = 1 WHERE product_id = ? AND image_url = ?")->execute([$productId, $imageUrl]);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit();
    }
}

// ─────────────────────────────────────────────────────────────
// GET Handler
// ─────────────────────────────────────────────────────────────
if ($method === 'GET') {
    if (($_GET['action'] ?? '') === 'get_stats') {
        try {
            $stats = [];
            try {
                $stats['total_revenue'] = $pdo->query("SELECT SUM(total_amount) FROM orders WHERE status != 'Dibatalkan'")->fetchColumn() ?: 0;
                
                // Revenue Trend (vs last month)
                $curMonthRev = $pdo->query("SELECT SUM(total_amount) FROM orders WHERE status != 'Dibatalkan' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())")->fetchColumn() ?: 0;
                $lastMonthRev = $pdo->query("SELECT SUM(total_amount) FROM orders WHERE status != 'Dibatalkan' AND MONTH(created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)")->fetchColumn() ?: 0;
                $stats['revenue_trend'] = $lastMonthRev > 0 ? round((($curMonthRev - $lastMonthRev) / $lastMonthRev) * 100, 1) : 0;
            } catch (Exception $e) {
                $stats['total_revenue'] = 0;
                $stats['revenue_trend'] = 0;
            }

            try {
                $stats['total_orders'] = $pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn() ?: 0;
                
                // Orders Trend (vs last month)
                $curMonthOrders = $pdo->query("SELECT COUNT(*) FROM orders WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())")->fetchColumn() ?: 0;
                $lastMonthOrders = $pdo->query("SELECT COUNT(*) FROM orders WHERE MONTH(created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)")->fetchColumn() ?: 0;
                $stats['orders_trend'] = $lastMonthOrders > 0 ? round((($curMonthOrders - $lastMonthOrders) / $lastMonthOrders) * 100, 1) : 0;
            } catch (Exception $e) {
                $stats['total_orders'] = 0;
                $stats['orders_trend'] = 0;
            }

            try {
                $stats['total_users'] = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'user'")->fetchColumn() ?: 0;
                
                // Users Trend (New this week)
                $stats['new_users_week'] = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn() ?: 0;
            } catch (Exception $e) {
                $stats['total_users'] = 0;
                $stats['new_users_week'] = 0;
            }

            // Global Eco Impact Stats
            try {
                $stats['total_waste_saved'] = $pdo->query("SELECT SUM(waste_saved) FROM users")->fetchColumn() ?: 0;
            } catch (Exception $e) {
                $stats['total_waste_saved'] = 0;
            }

            try {
                $stmt = $pdo->query("SELECT o.*, u.name as customer_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5");
                $stats['recent_orders'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) { $stats['recent_orders'] = []; }

            // Review Stats
            try {
                $stats['total_reviews'] = $pdo->query("SELECT COUNT(*) FROM product_reviews")->fetchColumn() ?: 0;
                $stats['avg_product_rating'] = round((float)$pdo->query("SELECT AVG(rating) FROM product_reviews")->fetchColumn() ?: 0, 1);
            } catch (Exception $e) { 
                $stats['total_reviews'] = 0; 
                $stats['avg_product_rating'] = 0;
            }

            // Testimonial Stats
            try {
                $stats['total_testimonials'] = $pdo->query("SELECT COUNT(*) FROM site_testimonials")->fetchColumn() ?: 0;
                $stats['avg_site_rating'] = round((float)$pdo->query("SELECT AVG(rating) FROM site_testimonials")->fetchColumn() ?: 0, 1);
            } catch (Exception $e) { 
                $stats['total_testimonials'] = 0;
                $stats['avg_site_rating'] = 0;
            }

            try {
                $stmtRev = $pdo->query("SELECT pr.*, p.name as product_name FROM product_reviews pr JOIN products p ON pr.product_id = p.id ORDER BY pr.created_at DESC LIMIT 5");
                $stats['recent_reviews'] = $stmtRev->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) { $stats['recent_reviews'] = []; }

            try {
                $stmtTest = $pdo->query("SELECT * FROM site_testimonials ORDER BY created_at DESC LIMIT 5");
                $stats['recent_testimonials'] = $stmtTest->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) { $stats['recent_testimonials'] = []; }

            echo json_encode(['success' => true, 'stats' => $stats]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit();
    }
}
