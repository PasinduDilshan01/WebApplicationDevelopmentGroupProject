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

    if (!$id || !filter_var($id, FILTER_VALIDATE_INT) || (int)$id < 1) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Invalid cinema hall ID."
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

    // Prevent deletion if showtimes exist
    $showtimeCheck = $pdo->prepare(
        "SELECT COUNT(*) FROM showtimes WHERE hall_id = ?"
    );

    $showtimeCheck->execute([$id]);

    if ($showtimeCheck->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "Cannot delete this hall because it has scheduled showtimes. Remove or reassign those showtimes first."
        ]);
        exit;
    }

    // Check whether hall seats are linked to bookings
    $bookingCheck = $pdo->prepare(
        "SELECT COUNT(*)
         FROM booking_seats bs
         INNER JOIN seats s ON bs.seat_id = s.id
         WHERE s.hall_id = ?"
    );

    $bookingCheck->execute([$id]);

    if ($bookingCheck->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "Cannot delete this hall because its seats are linked to bookings."
        ]);
        exit;
    }

    // Delete hall and its seats safely
    $pdo->beginTransaction();

    $deleteSeats = $pdo->prepare(
        "DELETE FROM seats WHERE hall_id = ?"
    );

    $deleteSeats->execute([$id]);

    $deleteHall = $pdo->prepare(
        "DELETE FROM cinema_halls WHERE id = ?"
    );

    $deleteHall->execute([$id]);

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Cinema hall deleted successfully."
    ]);

} catch (Throwable $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Hall deletion error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to delete cinema hall."
    ]);
}
?>