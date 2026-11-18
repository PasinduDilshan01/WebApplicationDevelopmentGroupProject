<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check administrator access
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

// Read JSON request
$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid request data."
    ]);

    exit;
}

// Get hall details
$name = trim($data["name"] ?? "");
$hallType = trim($data["hall_type"] ?? "");
$status = trim($data["status"] ?? "Active");
$seatLayout = $data["seat_layout"] ?? [];

// Validate basic information
if (
    $name === "" ||
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

// Validate seat layout
if (
    !is_array($seatLayout) ||
    count($seatLayout) === 0 ||
    count($seatLayout) > 50
) {
    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Please provide a valid seat layout."
    ]);

    exit;
}

$seatNumbers = [];
$calculatedTotal = 0;
$usedRows = [];

foreach ($seatLayout as $row) {

    $rowName = strtoupper(trim($row["row"] ?? ""));
    $seatCount = filter_var(
        $row["seats"] ?? null,
        FILTER_VALIDATE_INT
    );

    if (
        !preg_match('/^[A-Z]{1,3}$/', $rowName) ||
        $seatCount === false ||
        $seatCount < 1 ||
        $seatCount > 50
    ) {
        http_response_code(422);

        echo json_encode([
            "success" => false,
            "message" => "Invalid row name or seat count."
        ]);

        exit;
    }

    if (in_array($rowName, $usedRows, true)) {
        http_response_code(422);

        echo json_encode([
            "success" => false,
            "message" => "Duplicate row names are not allowed."
        ]);

        exit;
    }

    $usedRows[] = $rowName;

    for ($i = 1; $i <= $seatCount; $i++) {
        $seatNumbers[] = $rowName . $i;
    }

    $calculatedTotal += $seatCount;
}

// Limit total seating capacity
if ($calculatedTotal > 500) {
    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "A cinema hall cannot have more than 500 seats."
    ]);

    exit;
}

try {

    $database = new Database();
    $pdo = $database->connect();

    $pdo->beginTransaction();

    // Check duplicate hall name
    $check = $pdo->prepare(
        "SELECT id FROM cinema_halls WHERE name = ?"
    );

    $check->execute([$name]);

    if ($check->fetch()) {

        $pdo->rollBack();

        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" => "A cinema hall with this name already exists."
        ]);

        exit;
    }

    // Create cinema hall
    $hallStmt = $pdo->prepare("
        INSERT INTO cinema_halls
            (name, total_seats, hall_type, status)
        VALUES
            (?, ?, ?, ?)
    ");

    $hallStmt->execute([
        $name,
        $calculatedTotal,
        $hallType,
        $status
    ]);

    $hallId = (int) $pdo->lastInsertId();

    // Insert generated seats
    $seatStmt = $pdo->prepare("
        INSERT INTO seats (hall_id, seat_number)
        VALUES (?, ?)
    ");

    foreach ($seatNumbers as $seatNumber) {
        $seatStmt->execute([
            $hallId,
            $seatNumber
        ]);
    }

    // Save database changes
    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Cinema hall and seat layout created successfully.",
        "hall_id" => $hallId,
        "total_seats" => $calculatedTotal,
        "seats_created" => count($seatNumbers)
    ]);

} catch (Throwable $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Create Cinema Hall Error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to create cinema hall."
    ]);
}