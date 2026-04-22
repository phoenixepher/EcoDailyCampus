<?php
/**
 * API Endpoint: Product Inventory Management
 * Returns products with all their associated images
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

// Determine base URL for uploads
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
// Detect project base path from SCRIPT_NAME
$scriptDir = dirname(dirname($_SERVER['SCRIPT_NAME'])); // go up from /api/
$baseUrl = $protocol . '://' . $host . rtrim($scriptDir, '/');

try {
    // Fetch all products with category
    $stmt = $pdo->query("SELECT p.*, c.name as category_name 
                         FROM products p 
                         JOIN categories c ON p.category_id = c.id 
                         ORDER BY p.created_at DESC");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // For each product, fetch all images
    $imgStmt = $pdo->prepare("SELECT image_url, is_primary 
                               FROM product_images 
                               WHERE product_id = ? 
                               ORDER BY is_primary DESC");

    $result = [];
    foreach ($products as $p) {
        $imgStmt->execute([$p['id']]);
        $images = $imgStmt->fetchAll(PDO::FETCH_ASSOC);

        // Build full image URLs
        $imageUrls = [];
        $primaryImage = null;
        foreach ($images as $img) {
            $url = $img['image_url'];
            // If relative path, prepend base URL
            if ($url && !str_starts_with($url, 'http')) {
                $url = $baseUrl . '/public/' . ltrim($url, '/');
            }
            $imageUrls[] = $url;
            if ($img['is_primary'] && !$primaryImage) {
                $primaryImage = $url;
            }
        }

        if (!$primaryImage && count($imageUrls) > 0) {
            $primaryImage = $imageUrls[0];
        }
        if (!$primaryImage) {
            $primaryImage = 'https://via.placeholder.com/200x200?text=No+Image';
        }

        $result[] = [
            'id'          => (int)$p['id'],
            'name'        => $p['name'],
            'price'       => (float)$p['price'],
            'stock'       => (int)$p['stock'],
            'eco_points'  => (int)$p['eco_points'],
            'ecoPoints'   => (int)$p['eco_points'],
            'description' => $p['description'],
            'category'    => $p['category_name'],
            'category_id' => (int)$p['category_id'],
            'image'       => $primaryImage,        // primary image (for table display)
            'images'      => $imageUrls,           // all images array
            'is_active'   => (int)($p['is_active'] ?? 1),
        ];
    }

    echo json_encode(['success' => true, 'products' => $result]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
