<?php
/**
 * RECOVERY SCRIPT: RESTORE PRODUCT & CHALLENGE IMAGES
 * Fixes 404 errors by mapping new generated images to existing records.
 */
require_once 'api/config/db.php';

$images_map = [
    'products' => [
        'Alat makan portable' => 'uploads/portable_cutlery.png',
        'EcoLunchBox' => 'uploads/ecolunchbox.png',
        'Wooden Bottle' => 'uploads/wooden_bottle.png',
        'EcoFriendly Totebag' => 'uploads/ecofriendly_totebag.png'
    ],
    'challenges' => [
        'Gunakan LunchBox' => 'uploads/challenges/lunchbox_challenge.png',
        'Gunakan Tumbler' => 'uploads/challenges/tumbler_challenge.png',
        'Kampus Bebas Plastik' => 'uploads/challenges/plastic_free.png',
        'Gowes ke Kampus' => 'uploads/challenges/cycling.png'
    ]
];

try {
    // 1. Update Product Images
    foreach ($images_map['products'] as $name => $path) {
        $stmt = $pdo->prepare("UPDATE product_images pi JOIN products p ON pi.product_id = p.id SET pi.image_url = :path WHERE p.name LIKE :name");
        $stmt->execute(['path' => $path, 'name' => "%$name%"]);
        echo "Updated Product: $name\n";
    }

    // 2. Update Challenges
    foreach ($images_map['challenges'] as $title => $path) {
        $stmt = $pdo->prepare("UPDATE challenges SET image = :path WHERE title LIKE :title");
        $stmt->execute(['path' => $path, 'title' => "%$title%"]);
        echo "Updated Challenge: $title\n";
    }

    echo "Recovery Complete.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
