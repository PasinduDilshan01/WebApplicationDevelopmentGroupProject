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

    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Invalid request data."
        ]);
        exit;
    }

    $id = $data["id"] ?? null;
    $movie_id = $data["movie_id"] ?? null;
    $hall_id = $data["hall_id"] ?? null;
    $date = $data["date"] ?? "";
    $time = $data["time"] ?? "";
    $price = $data["price"] ?? null;

    // Validate input
    if (
        !filter_var($id, FILTER_VALIDATE_INT) ||
        (int)$id < 1 ||
        !filter_var($movie_id, FILTER_VALIDATE_INT) ||
        (int)$movie_id < 1 ||
        !filter_var($hall_id, FILTER_VALIDATE_INT) ||
        (int)$hall_id < 1 ||
        !is_string($date) ||
        !is_string($time) ||
        !is_numeric($price) ||
        (float)$price < 0
    ) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Please provide valid showtime details."
        ]);
        exit;
    }

    // Validate date and time
    $dateObject = DateTime::createFromFormat("!Y-m-d", $date);
    $timeObject = DateTime::createFromFormat("!H:i", $time);

    if (
        !$dateObject ||
        $dateObject->format("Y-m-d") !== $date ||
        !$timeObject ||
        $timeObject->format("H:i") !== $time
    ) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Invalid show date or time."
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

    // Prevent changes when bookings already exist
    $bookingCheck = $pdo->prepare(
        "SELECT COUNT(*) FROM bookings WHERE showtime_id = ?"
    );
    $bookingCheck->execute([(int)$id]);

    if ($bookingCheck->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "This showtime cannot be edited because bookings are already associated with it."
        ]);
        exit;
    }

    // Check movie
    $movieCheck = $pdo->prepare(
        "SELECT id FROM movies WHERE id = ?"
    );
    $movieCheck->execute([(int)$movie_id]);

    if (!$movieCheck->fetch()) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Selected movie was not found."
        ]);
        exit;
    }

    // Check active cinema hall
    $hallCheck = $pdo->prepare(
        "SELECT id FROM cinema_halls
         WHERE id = ? AND status = 'Active'"
    );
    $hallCheck->execute([(int)$hall_id]);

    if (!$hallCheck->fetch()) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Selected cinema hall was not found or is inactive."
        ]);
        exit;
    }

    // Check duplicate schedule in the same hall
    $duplicateCheck = $pdo->prepare(
        "SELECT id FROM showtimes
         WHERE hall_id = ?
         AND show_date = ?
         AND show_time = ?
         AND id != ?"
    );

    $duplicateCheck->execute([
        (int)$hall_id,
        $date,
        $time,
        (int)$id
    ]);

    if ($duplicateCheck->fetch()) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "This cinema hall already has a showtime at that date and time."
        ]);
        exit;
    }

    // Update showtime
    $stmt = $pdo->prepare(
        "UPDATE showtimes
         SET movie_id = ?,
             hall_id = ?,
             show_date = ?,
             show_time = ?,
             ticket_price = ?
         WHERE id = ?"
    );

    $stmt->execute([
        (int)$movie_id,
        (int)$hall_id,
        $date,
        $time,
        (float)$price,
        (int)$id
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Showtime updated successfully."
    ]);

} catch (Throwable $e) {

    error_log("Update showtime error: " . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to update showtime."
    ]);
}
?>