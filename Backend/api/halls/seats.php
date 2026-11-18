<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verify administrator access
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

// Allow GET requests only
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

// Get hall ID
$hallId = filter_input(
    INPUT_GET,
    "hall_id",
    FILTER_VALIDATE_INT
);

if (!$hallId || $hallId <= 0) {
    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Valid hall ID is required."
    ]);

    exit;
}

try {

    $database = new Database();
    $pdo = $database->connect();

    // Check whether hall exists
    $hallStmt = $pdo->prepare("
        SELECT id, name, total_seats
        FROM cinema_halls
        WHERE id = ?
        LIMIT 1
    ");

    $hallStmt->execute([$hallId]);

    $hall = $hallStmt->fetch(PDO::FETCH_ASSOC);

    if (!$hall) {
        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Cinema hall not found."
        ]);

        exit;
    }

    // Retrieve all seats belonging to this hall
    $seatStmt = $pdo->prepare("
        SELECT seat_number
        FROM seats
        WHERE hall_id = ?
        ORDER BY seat_number ASC
    ");

    $seatStmt->execute([$hallId]);

    $seats = $seatStmt->fetchAll(PDO::FETCH_COLUMN);

    // Group seats by their row letters
    $rows = [];

    foreach ($seats as $seatNumber) {

        // Example: A10 becomes row A and seat number 10
        if (!preg_match('/^([A-Z]{1,3})([0-9]+)$/i', $seatNumber, $matches)) {
            continue;
        }

        $rowName = strtoupper($matches[1]);
        $seatNumberOnly = (int) $matches[2];

        if (!isset($rows[$rowName])) {
            $rows[$rowName] = [];
        }

        $rows[$rowName][] = $seatNumberOnly;
    }

    // Sort rows alphabetically
    uksort($rows, function ($a, $b) {
        return strlen($a) === strlen($b)
            ? strcmp($a, $b)
            : strlen($a) - strlen($b);
    });

    // Build layout response
    $seatLayout = [];

    foreach ($rows as $rowName => $rowSeats) {

        sort($rowSeats, SORT_NUMERIC);

        $seatLayout[] = [
            "row" => $rowName,
            "seats" => count($rowSeats)
        ];
    }

    echo json_encode([
        "success" => true,
        "hall" => $hall,
        "seat_layout" => $seatLayout
    ]);

} catch (Throwable $e) {

    error_log("Load Hall Seats Error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve hall seat layout."
    ]);
}