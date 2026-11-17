<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check customer authentication
if (!isset($_SESSION["user_id"])) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Please log in to book tickets."
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

// Get submitted data
$data = json_decode(file_get_contents("php://input"), true);

$showtime_id = $data["showtime_id"] ?? null;
$seat_ids = $data["seat_ids"] ?? [];


// Validate showtime ID
if (
    !$showtime_id ||
    !filter_var($showtime_id, FILTER_VALIDATE_INT) ||
    $showtime_id <= 0
) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid showtime."
    ]);

    exit;
}


// Validate seat IDs
if (!is_array($seat_ids) || count($seat_ids) === 0) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Please select at least one seat."
    ]);

    exit;
}


// Remove duplicate seat IDs
$seat_ids = array_values(array_unique($seat_ids));


// Validate individual seat IDs
foreach ($seat_ids as $seat_id) {

    if (
        !filter_var($seat_id, FILTER_VALIDATE_INT) ||
        $seat_id <= 0
    ) {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Invalid seat selection."
        ]);

        exit;
    }

}


try {

    // Connect to database
    $database = new Database();
    $pdo = $database->connect();

    // Start transaction
    $pdo->beginTransaction();


    // Verify customer account
    $userStmt = $pdo->prepare(
        "SELECT id, status
         FROM users
         WHERE id = ?
         FOR UPDATE"
    );

    $userStmt->execute([
        $_SESSION["user_id"]
    ]);

    $user = $userStmt->fetch();


    if (!$user || $user["status"] !== "Active") {

        $pdo->rollBack();

        http_response_code(403);

        echo json_encode([
            "success" => false,
            "message" => "Your account is unavailable."
        ]);

        exit;
    }


    // Retrieve and lock showtime
    $showtimeStmt = $pdo->prepare(
        "SELECT
            st.id,
            st.hall_id,
            st.show_date,
            st.show_time,
            st.ticket_price,
            ch.status AS hall_status

         FROM showtimes st

         INNER JOIN cinema_halls ch
            ON st.hall_id = ch.id

         WHERE st.id = ?

         FOR UPDATE"
    );

    $showtimeStmt->execute([$showtime_id]);

    $showtime = $showtimeStmt->fetch();


    if (!$showtime || $showtime["hall_status"] !== "Active") {

        $pdo->rollBack();

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Showtime is unavailable."
        ]);

        exit;
    }


    // Check whether showtime has already passed
    $showtimeDateTime =
        $showtime["show_date"] . " " . $showtime["show_time"];


    if (strtotime($showtimeDateTime) <= time()) {

        $pdo->rollBack();

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "This showtime has already started."
        ]);

        exit;
    }


    // Lock selected seats belonging to the correct hall
    $placeholders = implode(
        ",",
        array_fill(0, count($seat_ids), "?")
    );


    $seatStmt = $pdo->prepare(
        "SELECT id, seat_number
         FROM seats
         WHERE hall_id = ?
         AND id IN ($placeholders)
         FOR UPDATE"
    );

    $seatStmt->execute(
        array_merge(
            [$showtime["hall_id"]],
            $seat_ids
        )
    );

    $selectedSeats = $seatStmt->fetchAll();


    if (count($selectedSeats) !== count($seat_ids)) {

        $pdo->rollBack();

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Some selected seats are invalid."
        ]);

        exit;
    }


    // Check whether selected seats are already booked
    $bookedStmt = $pdo->prepare(
        "SELECT bs.seat_id

         FROM booking_seats bs

         INNER JOIN bookings b
            ON bs.booking_id = b.id

         WHERE b.showtime_id = ?
         AND b.status IN ('Pending', 'Confirmed')
         AND bs.seat_id IN ($placeholders)"
    );

    $bookedStmt->execute(
        array_merge(
            [$showtime_id],
            $seat_ids
        )
    );

    $bookedSeats = $bookedStmt->fetchAll();


    if (count($bookedSeats) > 0) {

        $pdo->rollBack();

        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" => "Some selected seats are no longer available. Please select different seats."
        ]);

        exit;
    }


    // Calculate booking amount
    $ticketPrice = (float) $showtime["ticket_price"];

    $totalAmount = count($seat_ids) * $ticketPrice;


    // Generate booking reference
    $bookingReference = "CINE-" . strtoupper(
        bin2hex(random_bytes(5))
    );


    // Generate ONE unique QR token for the entire booking
    $ticketCode = bin2hex(random_bytes(32));


    // Create booking with QR token
    $bookingStmt = $pdo->prepare(
        "INSERT INTO bookings
            (
                booking_reference,
                user_id,
                showtime_id,
                total_amount,
                status,
                ticket_code,
                ticket_status
            )

         VALUES (?, ?, ?, ?, 'Pending', ?, 'Valid')"
    );

    $bookingStmt->execute([
        $bookingReference,
        $_SESSION["user_id"],
        $showtime_id,
        $totalAmount,
        $ticketCode
    ]);


    $bookingId = $pdo->lastInsertId();


    // Save all selected seats under the same booking
    $bookingSeatStmt = $pdo->prepare(
        "INSERT INTO booking_seats
            (booking_id, seat_id, ticket_price)
         VALUES (?, ?, ?)"
    );


    foreach ($seat_ids as $seat_id) {

        $bookingSeatStmt->execute([
            $bookingId,
            $seat_id,
            $ticketPrice
        ]);

    }


    // Commit database transaction
    $pdo->commit();


    // Return booking information
    echo json_encode([

        "success" => true,

        "message" => "Booking created successfully.",

        "booking" => [

            "id" => $bookingId,

            "booking_reference" => $bookingReference,

            "ticket_code" => $ticketCode,

            "ticket_status" => "Valid",

            "showtime_id" => $showtime_id,

            "seats" => $selectedSeats,

            "total_seats" => count($seat_ids),

            "ticket_price" => $ticketPrice,

            "total_amount" => $totalAmount,

            "status" => "Pending"

        ]

    ]);

} catch (PDOException $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Booking creation error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to create booking."
    ]);

} catch (Throwable $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Booking error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "An unexpected error occurred."
    ]);

}

?>