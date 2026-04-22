<?php
/**
 * API Endpoint: Fetch Products with Categories and Images
 */
require_once 'config/db.php';

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

$category = $_GET['category'] ?? 'All';

try {
    $sql = "SELECT p.*, c.name as category_name, i.image_url 
            FROM products p
            JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_images i ON p.id = i.product_id AND i.is_primary = 1
            WHERE p.is_active = 1";
    
    $params = [];
    if ($category !== 'All') {
        $sql .= " AND c.name = :category";
        $params['category'] = $category;
    }
    
    $sql .= " ORDER BY p.created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll();
    
    // Format JSON output to match front-end requirements
    echo json_encode([
        'success' => true,
        'count' => count($products),
        'products' => array_map(function($p) {
            return [
                'id' => (int)$p['id'],
                'name' => $p['name'],
                'price' => (float)$p['price'],
                'description' => $p['description'],
                'category' => $p['category_name'],
                'image' => $p['image_url'] ?? 'https://via.placeholder.com/600x600?text=No+Image',
                'stock' => (int)$p['stock'],
                'ecoPoints' => (int)$p['eco_points'],
                'rating' => 5.0, // Placeholder as not in schema yet
                'isNew' => (strtotime($p['created_at']) > strtotime('-7 days'))
            ];
        }, $products)
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
