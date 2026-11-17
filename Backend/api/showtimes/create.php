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

// Only allow POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
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

    if (!is_array($data)) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Invalid request data."
        ]);
        exit;
    }

    $movie_id = $data["movie_id"] ?? null;
    $hall_id = $data["hall_id"] ?? null;
    $date = $data["date"] ?? "";
    $time = $data["time"] ?? "";
    $price = $data["price"] ?? null;

    // Validate required fields
    if (
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

    // Validate date and time formats
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

    // Check movie exists
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

    // Check hall exists and is active
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

    // Prevent two showtimes in the same hall at the same date and time
    $duplicateCheck = $pdo->prepare(
        "SELECT id FROM showtimes
         WHERE hall_id = ?
         AND show_date = ?
         AND show_time = ?"
    );

    $duplicateCheck->execute([
        (int)$hall_id,
        $date,
        $time
    ]);

    if ($duplicateCheck->fetch()) {
        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" => "This cinema hall already has a showtime scheduled at that date and time."
        ]);
        exit;
    }

    // Insert showtime
    $stmt = $pdo->prepare(
        "INSERT INTO showtimes
        (movie_id, hall_id, show_date, show_time, ticket_price)
        VALUES (?, ?, ?, ?, ?)"
    );

    $stmt->execute([
        (int)$movie_id,
        (int)$hall_id,
        $date,
        $time,
        (float)$price
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Showtime scheduled successfully."
    ]);

} catch (Throwable $e) {

    error_log("Create showtime error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to schedule showtime."
    ]);
}
?>