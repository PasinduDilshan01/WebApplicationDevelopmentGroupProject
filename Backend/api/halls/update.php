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

// Allow PUT requests only
if ($_SERVER["REQUEST_METHOD"] !== "PUT") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

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

// Get hall information
$id = filter_var($data["id"] ?? null, FILTER_VALIDATE_INT);
$name = trim($data["name"] ?? "");
$hallType = trim($data["hall_type"] ?? "");
$status = trim($data["status"] ?? "");
$seatLayout = $data["seat_layout"] ?? [];

// Validate hall information
if (
    !$id ||
    $id <= 0 ||
    $name === "" ||
    $hallType === "" ||
    !in_array($status, ["Active", "Inactive"], true)
) {
    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Please provide valid hall details."
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

// Generate seat numbers
$desiredSeats = [];
$usedRows = [];
$totalSeats = 0;

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
        $desiredSeats[] = $rowName . $i;
    }

    $totalSeats += $seatCount;
}

// Limit seating capacity
if ($totalSeats > 500) {
    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Maximum seating capacity is 500 seats."
    ]);

    exit;
}

try {

    $database = new Database();
    $pdo = $database->connect();

    $pdo->beginTransaction();

    // Lock and check hall
    $check = $pdo->prepare("
        SELECT id
        FROM cinema_halls
        WHERE id = ?
        FOR UPDATE
    ");

    $check->execute([$id]);

    if (!$check->fetch()) {

        $pdo->rollBack();

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Cinema hall not found."
        ]);

        exit;
    }

    // Check duplicate hall name
    $duplicate = $pdo->prepare("
        SELECT id
        FROM cinema_halls
        WHERE name = ? AND id != ?
    ");

    $duplicate->execute([$name, $id]);

    if ($duplicate->fetch()) {

        $pdo->rollBack();

        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" => "A hall with this name already exists."
        ]);

        exit;
    }

    // Retrieve existing seats
    $existingStmt = $pdo->prepare("
        SELECT id, seat_number
        FROM seats
        WHERE hall_id = ?
        FOR UPDATE
    ");

    $existingStmt->execute([$id]);

    $existingSeats = $existingStmt->fetchAll(PDO::FETCH_ASSOC);

    $existingSeatMap = [];

    foreach ($existingSeats as $seat) {
        $existingSeatMap[$seat["seat_number"]] = $seat["id"];
    }

    // Find seats that need to be removed
    $seatsToRemove = array_diff(
        array_keys($existingSeatMap),
        $desiredSeats
    );

    // Protect seats already associated with bookings
    if (!empty($seatsToRemove)) {

        $placeholders = implode(
            ",",
            array_fill(0, count($seatsToRemove), "?")
        );

        $removedSeatIds = [];

        foreach ($seatsToRemove as $seatNumber) {
            $removedSeatIds[] = $existingSeatMap[$seatNumber];
        }

        $bookingCheck = $pdo->prepare("
            SELECT DISTINCT seat_id
            FROM booking_seats
            WHERE seat_id IN ($placeholders)
        ");

        $bookingCheck->execute($removedSeatIds);

        if ($bookingCheck->fetch()) {

            $pdo->rollBack();

            http_response_code(409);

            echo json_encode([
                "success" => false,
                "message" => "Some seats you are trying to remove are associated with existing bookings. Those seats cannot be removed."
            ]);

            exit;
        }

        // Delete only seats without booking associations
        $deleteSeats = $pdo->prepare("
            DELETE FROM seats
            WHERE id IN ($placeholders)
        ");

        $deleteSeats->execute($removedSeatIds);
    }

    // Insert new seats
    $insertSeat = $pdo->prepare("
        INSERT INTO seats (hall_id, seat_number)
        VALUES (?, ?)
    ");

    foreach ($desiredSeats as $seatNumber) {

        if (!isset($existingSeatMap[$seatNumber])) {

            $insertSeat->execute([
                $id,
                $seatNumber
            ]);
        }
    }

    // Update cinema hall details
    $update = $pdo->prepare("
        UPDATE cinema_halls
        SET
            name = ?,
            total_seats = ?,
            hall_type = ?,
            status = ?
        WHERE id = ?
    ");

    $update->execute([
        $name,
        $totalSeats,
        $hallType,
        $status,
        $id
    ]);

    // Commit all changes
    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Cinema hall and seat layout updated successfully.",
        "hall_id" => $id,
        "total_seats" => $totalSeats
    ]);

} catch (Throwable $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Hall update error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to update cinema hall."
    ]);
}