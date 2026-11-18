<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

session_start();

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);
    exit;
}

if (!isset($_SESSION["user_id"]) || $_SESSION["role"] !== "admin") {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Admin login required."
    ]);
    exit;
}

try {
    $database = new Database();
    $pdo = $database->connect();

    $adminId = $_SESSION["user_id"];

    // Confirm that the admin account is active.
    $adminStmt = $pdo->prepare(
        "SELECT id FROM users
         WHERE id = ? AND role = 'admin' AND status = 'Active'"
    );

    $adminStmt->execute([$adminId]);

    if (!$adminStmt->fetch()) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Admin account is inactive."
        ]);
        exit;
    }

    // Disconnect previous active sessions for this admin.
    $disconnectStmt = $pdo->prepare(
        "UPDATE scanner_sessions
         SET status = 'Disconnected'
         WHERE admin_id = ? AND status = 'Active'"
    );

    $disconnectStmt->execute([$adminId]);

    // Generate a secure session token.
    $sessionToken = bin2hex(random_bytes(32));

    // Create a new scanner session.
    $insertStmt = $pdo->prepare(
        "INSERT INTO scanner_sessions
         (session_token, admin_id, status)
         VALUES (?, ?, 'Active')"
    );

    $insertStmt->execute([$sessionToken, $adminId]);

    $sessionId = $pdo->lastInsertId();

    http_response_code(201);

    echo json_encode([
        "success" => true,
        "message" => "Scanner session created successfully.",
        "session" => [
            "id" => $sessionId,
            "session_token" => $sessionToken,
            "status" => "Active"
        ]
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Database error while creating scanner session."
    ]);

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to create scanner session."
    ]);
}