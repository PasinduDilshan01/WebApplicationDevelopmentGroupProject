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

// Only allow DELETE requests
if ($_SERVER["REQUEST_METHOD"] !== "DELETE") {
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

    if (
        !filter_var($id, FILTER_VALIDATE_INT) ||
        (int)$id < 1
    ) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Invalid showtime ID."
        ]);
        exit;
    }

    // Check whether showtime exists
    $check = $pdo->prepare(
        "SELECT id FROM showtimes WHERE id = ?"
    );
    $check->execute([(int)$id]);

    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Showtime not found."
        ]);
        exit;
    }

    // Prevent deletion if bookings exist
    $bookingCheck = $pdo->prepare(
        "SELECT COUNT(*) FROM bookings WHERE showtime_id = ?"
    );
    $bookingCheck->execute([(int)$id]);

    if ($bookingCheck->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "Cannot delete this showtime because bookings are associated with it."
        ]);
        exit;
    }

    // Delete showtime
    $stmt = $pdo->prepare(
        "DELETE FROM showtimes WHERE id = ?"
    );
    $stmt->execute([(int)$id]);

    echo json_encode([
        "success" => true,
        "message" => "Showtime deleted successfully."
    ]);

} catch (Throwable $e) {

    error_log("Delete showtime error: " . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to delete showtime."
    ]);
}
?>