<?php
require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

session_start();

// Check admin authentication
if (!isset($_SESSION["user_id"]) || $_SESSION["role"] !== "admin") {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Unauthorized access."
    ]);
    exit;
}

// Allow only PUT requests
if ($_SERVER["REQUEST_METHOD"] !== "PUT") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);
    exit;
}

// Read request data
$data = json_decode(file_get_contents("php://input"), true);

$id = $data["id"] ?? null;
$status = $data["status"] ?? "";

// Validate input
if (!$id || !in_array($status, ["Active", "Suspended"], true)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Valid customer ID and status are required."
    ]);
    exit;
}

try {
    $database = new Database();
    $pdo = $database->connect();

    // Make sure the customer exists and is not an admin
    $check = $pdo->prepare(
        "SELECT id FROM users WHERE id = ? AND role = 'user'"
    );
    $check->execute([$id]);

    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Customer not found."
        ]);
        exit;
    }

    // Update customer status
    $stmt = $pdo->prepare(
        "UPDATE users SET status = ? WHERE id = ? AND role = 'user'"
    );
    $stmt->execute([$status, $id]);

    echo json_encode([
        "success" => true,
        "message" => "Customer status updated successfully.",
        "status" => $status
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to update customer status."
    ]);
}
?>