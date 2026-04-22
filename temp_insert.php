<?php require_once "api/config/db.php"; $pdo->exec("INSERT INTO orders (user_id, total_amount, shipping_name, shipping_address, shipping_phone, status, created_at) VALUES 
(2, 125000.00, ''Student User'', ''Asrama Mahasiswa Blok A-12'', ''08123456789'', ''Pending'', NOW()),
(2, 45000.00, ''Student User'', ''Kantin Teknik Lt 2'', ''08123456789'', ''Selesai'', DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
(1, 1, 2, 45000.00),
(2, 1, 1, 45000.00);"); echo "Sample orders inserted."; ?>
