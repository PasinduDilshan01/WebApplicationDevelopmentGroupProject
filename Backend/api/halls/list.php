<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check admin authentication
if (
    !isset($_SESSION["user_id"]) ||
    !isset($_SESSION["role"]) ||
    $_SESSION["role"] !== "admin"
) {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Admin access required."
    ]);

    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

try {

    $database = new Database();
    $pdo = $database->connect();

    $sql = "
        SELECT
            id,
            name,
            total_seats,
            hall_type,
            status
        FROM cinema_halls
        ORDER BY id DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $halls = $stmt->fetchAll();

    echo json_encode([
        "success" => true,
        "halls" => $halls
    ]);

} catch (Throwable $e) {

    error_log("Cinema Hall List Error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve cinema halls."
    ]);
}