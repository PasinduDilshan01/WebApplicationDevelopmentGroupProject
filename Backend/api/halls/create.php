<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Only admins can create cinema halls
if (
    !isset($_SESSION["user_id"]) ||
    ($_SESSION["role"] ?? "") !== "admin"
) {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Admin access required."
    ]);

    exit;
}

// Allow POST requests only
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

// Read data sent from React
$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid request data."
    ]);

    exit;
}

$name = trim($data["name"] ?? "");
$totalSeats = filter_var(
    $data["total_seats"] ?? null,
    FILTER_VALIDATE_INT
);
$hallType = trim($data["hall_type"] ?? "");
$status = trim($data["status"] ?? "Active");

// Validate hall information
if (
    $name === "" ||
    $totalSeats === false ||
    $totalSeats <= 0 ||
    $hallType === "" ||
    !in_array($status, ["Active", "Inactive"], true)
) {
    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Please provide valid cinema hall details."
    ]);

    exit;
}

try {

    // Connect to MySQL
    $database = new Database();
    $pdo = $database->connect();

    // Check whether the hall name already exists
    $check = $pdo->prepare(
        "SELECT id FROM cinema_halls WHERE name = ?"
    );

    $check->execute([$name]);

    if ($check->fetch()) {
        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" => "A cinema hall with this name already exists."
        ]);

        exit;
    }

    // Insert the new cinema hall
    $stmt = $pdo->prepare("
        INSERT INTO cinema_halls
            (name, total_seats, hall_type, status)
        VALUES
            (?, ?, ?, ?)
    ");

    $stmt->execute([
        $name,
        $totalSeats,
        $hallType,
        $status
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Cinema hall added successfully.",
        "hall_id" => (int) $pdo->lastInsertId()
    ]);

} catch (Throwable $e) {

    error_log("Create Cinema Hall Error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to create cinema hall."
    ]);
}