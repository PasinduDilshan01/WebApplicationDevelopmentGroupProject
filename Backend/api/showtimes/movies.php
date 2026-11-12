<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

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

try {
    $database = new Database();
    $pdo = $database->connect();

    $stmt = $pdo->prepare("
        SELECT id, title
        FROM movies
        ORDER BY title ASC
    ");

    $stmt->execute();

    echo json_encode([
        "success" => true,
        "movies" => $stmt->fetchAll()
    ]);

} catch (Throwable $e) {
    error_log("Showtime movies error: " . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve movies."
    ]);
}
?>