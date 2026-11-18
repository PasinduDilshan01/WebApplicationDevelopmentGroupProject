<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

session_start();

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);
    exit;
}

// Check admin login.
if (
    !isset($_SESSION["user_id"]) ||
    !isset($_SESSION["role"]) ||
    $_SESSION["role"] !== "admin"
) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Admin login required."
    ]);
    exit;
}

$sessionId = $_GET["session_id"] ?? "";

if (empty($sessionId)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Scanner session ID is required."
    ]);
    exit;
}

try {

    $database = new Database();
    $pdo = $database->connect();

    // Retrieve the scanner session belonging to this admin.
    $stmt = $pdo->prepare("
        SELECT
            id,
            status,
            last_scan_booking_id,
            last_scan_status,
            last_scan_message,
            last_scan_data,
            updated_at
        FROM scanner_sessions
        WHERE id = ? AND admin_id = ?
        LIMIT 1
    ");

    $stmt->execute([
        $sessionId,
        $_SESSION["user_id"]
    ]);

    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Scanner session not found."
        ]);
        exit;
    }

    // Check whether the admin account is still active.
    $adminStmt = $pdo->prepare("
        SELECT id
        FROM users
        WHERE id = ?
          AND role = 'admin'
          AND status = 'Active'
    ");

    $adminStmt->execute([$_SESSION["user_id"]]);

    if (!$adminStmt->fetch()) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Admin account is inactive."
        ]);
        exit;
    }

    $scanData = null;

    if (!empty($session["last_scan_data"])) {
        $scanData = json_decode(
            $session["last_scan_data"],
            true
        );
    }

    echo json_encode([
        "success" => true,
        "session_status" => $session["status"],
        "last_scan" => $scanData,
        "last_scan_status" => $session["last_scan_status"],
        "last_scan_message" => $session["last_scan_message"],
        "updated_at" => $session["updated_at"]
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Database error while retrieving scanner results."
    ]);
}