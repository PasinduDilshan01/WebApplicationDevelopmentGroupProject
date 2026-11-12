<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check admin access
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

// Only allow PUT requests
if ($_SERVER["REQUEST_METHOD"] !== "PUT") {
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

    // Read JSON data
    $data = json_decode(file_get_contents("php://input"), true);

    $id = $data["id"] ?? null;
    $name = trim($data["name"] ?? "");
    $total_seats = $data["total_seats"] ?? null;
    $hall_type = trim($data["hall_type"] ?? "");
    $status = $data["status"] ?? "";

    // Validate inputs
    if (
        !$id ||
        $name === "" ||
        !is_numeric($total_seats) ||
        (int)$total_seats < 1 ||
        $hall_type === "" ||
        !in_array($status, ["Active", "Inactive"], true)
    ) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Please provide valid hall details."
        ]);
        exit;
    }

    // Check whether hall exists
    $check = $pdo->prepare(
        "SELECT id FROM cinema_halls WHERE id = ?"
    );
    $check->execute([$id]);

    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Cinema hall not found."
        ]);
        exit;
    }

    // Check duplicate hall name
    $duplicate = $pdo->prepare(
        "SELECT id FROM cinema_halls WHERE name = ? AND id != ?"
    );
    $duplicate->execute([$name, $id]);

    if ($duplicate->fetch()) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "A hall with this name already exists."
        ]);
        exit;
    }

    // Update hall
    $stmt = $pdo->prepare(
        "UPDATE cinema_halls
         SET name = ?, total_seats = ?, hall_type = ?, status = ?
         WHERE id = ?"
    );

    $stmt->execute([
        $name,
        (int)$total_seats,
        $hall_type,
        $status,
        $id
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Cinema hall updated successfully."
    ]);

} catch (Throwable $e) {

    error_log("Hall update error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to update cinema hall."
    ]);
}
?>