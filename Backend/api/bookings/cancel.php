<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check authentication
if (!isset($_SESSION["user_id"])) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Please log in to continue."
    ]);

    exit;
}

// Allow POST only
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

// Read request
$data = json_decode(file_get_contents("php://input"), true);

$bookingId = isset($data["booking_id"])
    ? (int) $data["booking_id"]
    : 0;

if ($bookingId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid booking ID."
    ]);

    exit;
}

try {

    $database = new Database();
    $pdo = $database->connect();

    $pdo->beginTransaction();

    // Find booking belonging to logged-in customer
    $stmt = $pdo->prepare("
        SELECT id, status
        FROM bookings
        WHERE id = ?
        AND user_id = ?
        FOR UPDATE
    ");

    $stmt->execute([
        $bookingId,
        $_SESSION["user_id"]
    ]);

    $booking = $stmt->fetch();

    if (!$booking) {

        $pdo->rollBack();

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Booking not found."
        ]);

        exit;
    }

    // Only Pending bookings can be cancelled
    if ($booking["status"] !== "Pending") {

        $pdo->rollBack();

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Only pending bookings can be cancelled."
        ]);

        exit;
    }

    // Cancel booking
    $updateStmt = $pdo->prepare("
        UPDATE bookings
        SET status = 'Cancelled'
        WHERE id = ?
        AND user_id = ?
    ");

    $updateStmt->execute([
        $bookingId,
        $_SESSION["user_id"]
    ]);

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Booking cancelled successfully."
    ]);

} catch (Throwable $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Booking cancellation error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to cancel booking."
    ]);

}

?>