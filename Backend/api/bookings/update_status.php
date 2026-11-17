<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// CHECK ADMIN ACCESS
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

// ONLY ALLOW PUT REQUESTS
if ($_SERVER["REQUEST_METHOD"] !== "PUT") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

try {

    // CONNECT TO MYSQL
    $database = new Database();
    $pdo = $database->connect();

    // READ JSON DATA
    $data = json_decode(
        file_get_contents("php://input"),
        true
    );

    if (!is_array($data)) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Invalid request data."
        ]);

        exit;
    }

    $id = filter_var(
        $data["id"] ?? null,
        FILTER_VALIDATE_INT
    );

    $status = $data["status"] ?? "";

    // VALIDATE BOOKING ID
    if ($id === false || $id === null || $id < 1) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Invalid booking ID."
        ]);

        exit;
    }

    // VALIDATE BOOKING STATUS
    $allowedStatuses = [
        "Confirmed",
        "Cancelled"
    ];

    if (!in_array($status, $allowedStatuses, true)) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Invalid booking status."
        ]);

        exit;
    }

    // START TRANSACTION
    $pdo->beginTransaction();

    // FIND BOOKING AND LOCK ROW
    $check = $pdo->prepare(
        "SELECT id, status
         FROM bookings
         WHERE id = ?
         FOR UPDATE"
    );

    $check->execute([$id]);

    $booking = $check->fetch();

    if (!$booking) {
        $pdo->rollBack();

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Booking not found."
        ]);

        exit;
    }

    $currentStatus = $booking["status"];

    // PREVENT REACTIVATING CANCELLED BOOKINGS
    if (
        $currentStatus === "Cancelled" &&
        $status === "Confirmed"
    ) {
        $pdo->rollBack();

        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" =>
                "A cancelled booking cannot be confirmed again."
        ]);

        exit;
    }

    // NOTHING TO CHANGE
    if ($currentStatus === $status) {
        $pdo->commit();

        echo json_encode([
            "success" => true,
            "message" => "Booking already has this status."
        ]);

        exit;
    }

    // UPDATE BOOKING STATUS
    $stmt = $pdo->prepare(
        "UPDATE bookings
         SET status = ?
         WHERE id = ?"
    );

    $stmt->execute([
        $status,
        $id
    ]);

    // SAVE CHANGES
    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Booking status updated successfully.",
        "status" => $status
    ]);

} catch (Throwable $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        "Booking status update error: " . $e->getMessage()
    );

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to update booking status."
    ]);
}

?>