<?php
/**
 * API Endpoint: Eco Challenge System
 * Handles challenge listing, submissions, and admin management.
 */
require_once 'config/db.php';

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

error_reporting(E_ALL & ~E_NOTICE);
ini_set('display_errors', 0);

$method = $_SERVER['REQUEST_METHOD'];

// Helper to check if user is logged in
function getUserId() {
    return $_SESSION['user_id'] ?? null;
}

function isAdmin() {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
}

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'list';
    
    // 1. List All Active Challenges for Users
    if ($action === 'list') {
        $today = date('Y-m-d');
        // Challenges that are active (simplified for debugging)
        $sql = "SELECT * FROM challenges 
                WHERE status = 'active' 
                ORDER BY created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $challenges = $stmt->fetchAll();
        
        // If user is logged in, mark challenges they've already submitted
        $userId = getUserId();
        if ($userId) {
            $subStmt = $pdo->prepare("SELECT challenge_id, status FROM challenge_submissions WHERE user_id = ?");
            $subStmt->execute([$userId]);
            $mySubs = $subStmt->fetchAll(PDO::FETCH_KEY_PAIR); // [challenge_id => status]
            
            foreach ($challenges as &$c) {
                $c['my_status'] = $mySubs[$c['id']] ?? null;
                $c['is_submitted'] = isset($mySubs[$c['id']]);
                $c['is_approved'] = ($mySubs[$c['id']] ?? '') === 'approved';
            }
        }
        
        echo json_encode(['success' => true, 'challenges' => $challenges]);
    } 
    // 2. User's Own Submissions
    else if ($action === 'my_submissions') {
        $userId = getUserId();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }
        $stmt = $pdo->prepare("SELECT s.*, c.title as challenge_title, c.reward_points 
                               FROM challenge_submissions s 
                               JOIN challenges c ON s.challenge_id = c.id 
                               WHERE s.user_id = ? 
                               ORDER BY s.created_at DESC");
        $stmt->execute([$userId]);
        echo json_encode(['success' => true, 'submissions' => $stmt->fetchAll()]);
    }
    // 3. User Impact Stats
    else if ($action === 'user_impact') {
        $userId = getUserId();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            exit;
        }

        $uStmt = $pdo->prepare("SELECT eco_points, waste_saved FROM users WHERE id = ?");
        $uStmt->execute([$userId]);
        $user = $uStmt->fetch();

        $cStmt = $pdo->prepare("SELECT COUNT(*) as completed FROM challenge_submissions WHERE user_id = ? AND status = 'approved'");
        $cStmt->execute([$userId]);
        $completed = $cStmt->fetch()['completed'] ?? 0;

        $oStmt = $pdo->prepare("SELECT COUNT(*) as total FROM orders WHERE user_id = ?");
        $oStmt->execute([$userId]);
        $totalOrders = $oStmt->fetch()['total'] ?? 0;

        $activitiesStmt = $pdo->prepare("SELECT 'challenge' as type, c.title as name, s.status, s.created_at 
                                         FROM challenge_submissions s 
                                         JOIN challenges c ON s.challenge_id = c.id 
                                         WHERE s.user_id = ? 
                                         ORDER BY s.created_at DESC LIMIT 5");
        $activitiesStmt->execute([$userId]);
        $activities = $activitiesStmt->fetchAll();

        echo json_encode([
            'success' => true,
            'stats' => [
                'eco_points' => (int)($user['eco_points'] ?? 0),
                'waste_saved' => (float)($user['waste_saved'] ?? 0),
                'challenges_completed' => (int)$completed,
                'total_orders' => (int)$totalOrders
            ],
            'recent_activities' => $activities
        ]);
    }
    // 4. Admin: List Pending Submissions
    else if ($action === 'admin_list' && isAdmin()) {
        $stmt = $pdo->query("SELECT s.*, c.title as challenge_title, c.reward_points, u.name as user_name 
                             FROM challenge_submissions s 
                             JOIN challenges c ON s.challenge_id = c.id 
                             JOIN users u ON s.user_id = u.id 
                             WHERE s.status = 'pending' 
                             ORDER BY s.created_at ASC");
        echo json_encode(['success' => true, 'submissions' => $stmt->fetchAll()]);
    }
    // 5. Admin: List All Challenges (No filtering)
    else if ($action === 'admin_all_challenges' && isAdmin()) {
        $stmt = $pdo->query("SELECT * FROM challenges ORDER BY created_at DESC");
        echo json_encode(['success' => true, 'challenges' => $stmt->fetchAll()]);
    }
} 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $_POST['action'] ?? $data['action'] ?? '';
    $userId = getUserId();

    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }

    // A. Submit Challenge (User)
    if ($action === 'submit') {
        $challengeId = $_POST['challenge_id'] ?? '';
        
        // Validasi: Cek apakah challenge masih aktif
        $stmtC = $pdo->prepare("SELECT * FROM challenges WHERE id = ? AND status = 'active'");
        $stmtC->execute([$challengeId]);
        $challenge = $stmtC->fetch();
        
        if (!$challenge) {
            echo json_encode(['success' => false, 'message' => 'Challenge tidak ditemukan atau sudah tidak aktif.']);
            exit;
        }
        
        $today = date('Y-m-d');
        if (($challenge['start_date'] && $today < $challenge['start_date']) || ($challenge['end_date'] && $today > $challenge['end_date'])) {
            echo json_encode(['success' => false, 'message' => 'Challenge ini sedang tidak dalam periode aktif (Expired/Coming Soon).']);
            exit;
        }
        
        // Validasi: Cek apakah sudah pernah submit (terutama yang approved)
        $stmtCheck = $pdo->prepare("SELECT status FROM challenge_submissions WHERE user_id = ? AND challenge_id = ?");
        $stmtCheck->execute([$userId, $challengeId]);
        $existing = $stmtCheck->fetch();
        
        if ($existing) {
            if ($existing['status'] === 'approved') {
                echo json_encode(['success' => false, 'message' => 'Anda sudah menyelesaikan challenge ini dan telah disetujui.']);
                exit;
            } else if ($existing['status'] === 'pending') {
                echo json_encode(['success' => false, 'message' => 'Submission Anda sebelumnya masih dalam proses verifikasi.']);
                exit;
            }
            // Jika rejected, diperbolehkan submit ulang sesuai instruksi (implied)
        }
        
        if (isset($_FILES['proof_image']) && $_FILES['proof_image']['error'] === 0) {
            $uploadDir = '../public/uploads/challenges/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            
            $ext = pathinfo($_FILES['proof_image']['name'], PATHINFO_EXTENSION);
            $fileName = 'sub_' . $userId . '_' . $challengeId . '_' . time() . '.' . $ext;
            $targetPath = $uploadDir . $fileName;
            
            if (move_uploaded_file($_FILES['proof_image']['tmp_name'], $targetPath)) {
                chmod($targetPath, 0644);
                $imgUrl = 'uploads/challenges/' . $fileName;
                
                if ($existing && $existing['status'] === 'rejected') {
                    $stmt = $pdo->prepare("UPDATE challenge_submissions SET proof_image = ?, status = 'pending', admin_note = NULL, created_at = CURRENT_TIMESTAMP WHERE user_id = ? AND challenge_id = ?");
                    $stmt->execute([$imgUrl, $userId, $challengeId]);
                } else {
                    $stmt = $pdo->prepare("INSERT INTO challenge_submissions (challenge_id, user_id, proof_image, status) VALUES (?, ?, ?, 'pending')");
                    $stmt->execute([$challengeId, $userId, $imgUrl]);
                }
                echo json_encode(['success' => true, 'message' => 'Submission berhasil! Menunggu verifikasi admin.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Gagal mengunggah foto bukti.']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Foto bukti wajib diunggah.']);
        }
    } 
    // B. Admin: Verify Submission
    elseif ($action === 'admin_verify' && isAdmin()) {
        $submissionId = $data['submission_id'] ?? '';
        $status = $data['status'] ?? ''; // 'approved' or 'rejected'
        $note = $data['note'] ?? '';

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("SELECT s.*, c.reward_points, c.waste_saved FROM challenge_submissions s JOIN challenges c ON s.challenge_id = c.id WHERE s.id = ? AND s.status = 'pending'");
            $stmt->execute([$submissionId]);
            $submission = $stmt->fetch();

            if (!$submission) throw new Exception("Submission tidak ditemukan atau sudah diproses.");

            $upd = $pdo->prepare("UPDATE challenge_submissions SET status = ?, admin_note = ? WHERE id = ?");
            $upd->execute([$status, $note, $submissionId]);

            if ($status === 'approved') {
                $points = (int)$submission['reward_points'];
                $waste = (float)($submission['waste_saved'] ?? 0);
                $uid = $submission['user_id'];
                
                $pdo->prepare("UPDATE users SET eco_points = eco_points + ?, waste_saved = waste_saved + ? WHERE id = ?")
                    ->execute([$points, $waste, $uid]);
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => "Submission berhasil di-" . ($status === 'approved' ? 'setujui' : 'tolak') . "."]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    } 
    // C. Admin: Create Challenge
    elseif ($action === 'admin_add_challenge' && isAdmin()) {
        // Handle multipart/form-data for image upload
        $title = $_POST['title'] ?? ($data['title'] ?? '');
        $description = $_POST['description'] ?? ($data['description'] ?? '');
        $reward = (int)($_POST['reward_points'] ?? ($data['reward_points'] ?? 10));
        $wasteSaved = (float)($_POST['waste_saved'] ?? ($data['waste_saved'] ?? 0));
        $difficulty = $_POST['difficulty'] ?? ($data['difficulty'] ?? 'easy');
        $status = $_POST['status'] ?? ($data['status'] ?? 'active');
        $startDate = $_POST['start_date'] ?? ($data['start_date'] ?? '');
        $endDate = $_POST['end_date'] ?? ($data['end_date'] ?? '');

        // Convert empty strings to NULL for DB
        $startDate = !empty($startDate) ? $startDate : null;
        $endDate = !empty($endDate) ? $endDate : null;

        if (!$title || !$description) {
            echo json_encode(['success' => false, 'message' => 'Judul dan deskripsi wajib diisi.']);
            exit;
        }

        $imgUrl = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] === 0) {
            $uploadDir = '../public/uploads/challenges/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
            $fileName = 'ch_' . time() . '.' . $ext;
            if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $fileName)) {
                chmod($uploadDir . $fileName, 0644);
                $imgUrl = 'uploads/challenges/' . $fileName;
            }
        }

        $sql = "INSERT INTO challenges (title, description, reward_points, waste_saved, difficulty, image, status, start_date, end_date) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        if ($stmt->execute([$title, $description, $reward, $wasteSaved, $difficulty, $imgUrl, $status, $startDate, $endDate])) {
            echo json_encode(['success' => true, 'message' => 'Challenge berhasil dibuat!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal menyimpan challenge ke database.']);
        }
    }
    // D. Admin: Delete Challenge
    elseif ($action === 'admin_delete_challenge' && isAdmin()) {
        $id = $data['id'] ?? $_POST['id'] ?? '';
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID Challenge tidak ditemukan.']);
            exit;
        }

        // Optional: Delete image file
        $stmt = $pdo->prepare("SELECT image FROM challenges WHERE id = ?");
        $stmt->execute([$id]);
        $c = $stmt->fetch();
        if ($c && $c['image']) {
            $imgPath = '../public/' . $c['image'];
            if (file_exists($imgPath)) @unlink($imgPath);
        }

        $stmt = $pdo->prepare("DELETE FROM challenges WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(['success' => true, 'message' => 'Challenge berhasil dihapus!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus challenge.']);
        }
    }
    // E. Admin: Edit Challenge
    elseif ($action === 'admin_edit_challenge' && isAdmin()) {
        $id = $_POST['id'] ?? ($data['id'] ?? '');
        $title = $_POST['title'] ?? ($data['title'] ?? '');
        $description = $_POST['description'] ?? ($data['description'] ?? '');
        $reward = (int)($_POST['reward_points'] ?? ($data['reward_points'] ?? 10));
        $wasteSaved = (float)($_POST['waste_saved'] ?? ($data['waste_saved'] ?? 0));
        $difficulty = $_POST['difficulty'] ?? ($data['difficulty'] ?? 'easy');
        $status = $_POST['status'] ?? ($data['status'] ?? 'active');
        $startDate = $_POST['start_date'] ?? ($data['start_date'] ?? '');
        $endDate = $_POST['end_date'] ?? ($data['end_date'] ?? '');

        $startDate = !empty($startDate) ? $startDate : null;
        $endDate = !empty($endDate) ? $endDate : null;

        if (!$id || !$title || !$description) {
            echo json_encode(['success' => false, 'message' => 'ID, Judul dan deskripsi wajib diisi.']);
            exit;
        }

        // Handle image update
        $imgUrl = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] === 0) {
            $uploadDir = '../public/uploads/challenges/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
            $fileName = 'ch_' . time() . '.' . $ext;
            if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $fileName)) {
                chmod($uploadDir . $fileName, 0644);
                $imgUrl = 'uploads/challenges/' . $fileName;
            }
        }

        if ($imgUrl) {
            $sql = "UPDATE challenges SET title=?, description=?, reward_points=?, waste_saved=?, difficulty=?, status=?, start_date=?, end_date=?, image=? WHERE id=?";
            $params = [$title, $description, $reward, $wasteSaved, $difficulty, $status, $startDate, $endDate, $imgUrl, $id];
        } else {
            $sql = "UPDATE challenges SET title=?, description=?, reward_points=?, waste_saved=?, difficulty=?, status=?, start_date=?, end_date=? WHERE id=?";
            $params = [$title, $description, $reward, $wasteSaved, $difficulty, $status, $startDate, $endDate, $id];
        }

        $stmt = $pdo->prepare($sql);
        if ($stmt->execute($params)) {
            echo json_encode(['success' => true, 'message' => 'Challenge berhasil diperbarui!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal memperbarui challenge.']);
        }
    }
}
?>
