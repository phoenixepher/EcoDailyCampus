<?php
/**
 * API Endpoint: Professional Authentication (Login & Register)
 * Features Backend Data Verification and Password Hashing
 */
require_once 'config/db.php';

header('Content-Type: application/json');
// Handle CORS with Credentials (cannot use * with Credentials)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

session_start();

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    $action = $_POST['action'] ?? ($data['action'] ?? '');
    
    if ($action === 'login') {
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            unset($user['password']); 
            
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_role'] = $user['role'];
            
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => (int)$user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'avatar' => $user['avatar'],
                    'points' => (int)$user['eco_points'],
                    'wasteSaved' => (float)$user['waste_saved'],
                    'prodi' => $user['prodi'],
                    'classCode' => $user['class_code']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid email or password!']);
        }
        
    } else if ($action === 'register') {
        $name = $data['name'] ?? '';
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        
        if (!preg_match('/@gmail\.com$/', $email)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Registration is restricted to @gmail.com accounts only!']);
            exit();
        }

        $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $check->execute([$email]);
        if ($check->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email already registered!']);
            exit();
        }
        
        $hashed = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')");
        
        if ($stmt->execute([$name, $email, $hashed])) {
            $newId = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'id' => (int)$newId]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Registration failed!']);
        }
    } else if ($action === 'update_profile') {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit();
        }

        $userId = $_SESSION['user_id'];
        $name = $_POST['name'] ?? '';
        $email = $_POST['email'] ?? '';
        $bio = $_POST['bio'] ?? '';
        $fakultas = $_POST['fakultas'] ?? '';
        $prodi = $_POST['prodi'] ?? '';
        $class_code = $_POST['class_code'] ?? '';

        // Handle Avatar Upload
        $avatarUrl = null;
        if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === 0) {
            $uploadDir = '../public/uploads/avatars/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            
            $ext = pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION);
            $fileName = 'u_' . $userId . '_' . time() . '.' . $ext;
            if (move_uploaded_file($_FILES['avatar']['tmp_name'], $uploadDir . $fileName)) {
                $avatarUrl = 'uploads/avatars/' . $fileName;
            }
        }

        try {
            $sql = "UPDATE users SET name = ?, email = ?, bio = ?, fakultas = ?, prodi = ?, class_code = ? WHERE id = ?";
            $params = [$name, $email, $bio, $fakultas, $prodi, $class_code, $userId];

            if ($avatarUrl) {
                $sql = "UPDATE users SET name = ?, email = ?, avatar = ?, bio = ?, fakultas = ?, prodi = ?, class_code = ? WHERE id = ?";
                $params = [$name, $email, $avatarUrl, $bio, $fakultas, $prodi, $class_code, $userId];
            }

            $stmt = $pdo->prepare($sql);
            if ($stmt->execute($params)) {
                // Fetch updated user
                $uStmt = $pdo->prepare("SELECT id, email, name, role, avatar, bio, fakultas, prodi, class_code, eco_points, waste_saved FROM users WHERE id = ?");
                $uStmt->execute([$userId]);
                $user = $uStmt->fetch();
                
                $_SESSION['user_name'] = $user['name']; // Sync session
                
                $finalUser = [
                    'id' => (int)$user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'avatar' => $user['avatar'],
                    'bio' => $user['bio'],
                    'fakultas' => $user['fakultas'],
                    'prodi' => $user['prodi'],
                    'classCode' => $user['class_code'],
                    'points' => (int)$user['eco_points'],
                    'wasteSaved' => (float)$user['waste_saved']
                ];

                echo json_encode(['success' => true, 'message' => 'Profile updated!', 'user' => $finalUser]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update database']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    } else if ($action === 'change_password') {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit();
        }

        $userId = $_SESSION['user_id'];
        $currentPass = $_POST['current_password'] ?? '';
        $newPass = $_POST['new_password'] ?? '';
        $confirmPass = $_POST['confirm_password'] ?? '';

        if (empty($currentPass) || empty($newPass) || empty($confirmPass)) {
            echo json_encode(['success' => false, 'message' => 'All fields are required']);
            exit();
        }

        if ($newPass !== $confirmPass) {
            echo json_encode(['success' => false, 'message' => 'New passwords do not match']);
            exit();
        }

        if (strlen($newPass) < 6) {
            echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
            exit();
        }

        // Verify old password
        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($currentPass, $user['password'])) {
            echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
            exit();
        }

        // Update to new password
        $hashed = password_hash($newPass, PASSWORD_BCRYPT);
        $uStmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        if ($uStmt->execute([$hashed, $userId])) {
            echo json_encode(['success' => true, 'message' => 'Password changed successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Update failed']);
        }
    }
}
?>
