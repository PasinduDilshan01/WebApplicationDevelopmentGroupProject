<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);
    exit;
}

session_start();

// Only logged-in admins can verify tickets.
if (!isset($_SESSION["user_id"]) || !isset($_SESSION["role"])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Please log in as an administrator."
    ]);
    exit;
}

if ($_SESSION["role"] !== "admin") {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Access denied. Admin permission required."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$ticketCode = trim($data["ticket_code"] ?? "");

if ($ticketCode === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Ticket QR code is missing."
    ]);
    exit;
}

try {
    $database = new Database();
    $pdo = $database->connect();

    // Start transaction to prevent two admins from using
    // the same ticket at the same time.
    $pdo->beginTransaction();

    // Find and lock the booking row.
    $bookingQuery = "
        SELECT
            id,
            booking_reference,
            user_id,
            showtime_id,
            status,
            ticket_status
        FROM bookings
        WHERE ticket_code = ?
        LIMIT 1
        FOR UPDATE
    ";

    $bookingStmt = $pdo->prepare($bookingQuery);
    $bookingStmt->execute([$ticketCode]);

    $booking = $bookingStmt->fetch(PDO::FETCH_ASSOC);

    if (!$booking) {
        $pdo->rollBack();

        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Invalid ticket. No booking was found for this QR code."
        ]);
        exit;
    }

    // Check booking status.
    if ($booking["status"] !== "Confirmed") {
        $pdo->rollBack();

        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "This booking is not confirmed."
        ]);
        exit;
    }

    // Check whether the ticket has already been used.
    if ($booking["ticket_status"] === "Used") {
        $pdo->rollBack();

        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "This ticket has already been used."
        ]);
        exit;
    }

    // Get booking, customer, movie, hall, showtime and seat details.
    $detailsQuery = "
        SELECT
            b.booking_reference,
            u.name AS customer_name,
            m.title AS movie_title,
            h.name AS hall_name,
            st.show_date,
            st.show_time,
            GROUP_CONCAT(
                s.seat_number
                ORDER BY s.seat_number
                SEPARATOR ', '
            ) AS seats,
            b.ticket_status,

            (
                SELECT p.payment_status
                FROM payments p
                WHERE p.booking_id = b.id
                ORDER BY p.id DESC
                LIMIT 1
            ) AS payment_status

        FROM bookings b

        INNER JOIN users u
            ON b.user_id = u.id

        INNER JOIN showtimes st
            ON b.showtime_id = st.id

        INNER JOIN movies m
            ON st.movie_id = m.id

        INNER JOIN cinema_halls h
            ON st.hall_id = h.id

        LEFT JOIN booking_seats bs
            ON b.id = bs.booking_id

        LEFT JOIN seats s
            ON bs.seat_id = s.id

        WHERE b.id = ?

        GROUP BY
            b.id,
            b.booking_reference,
            u.name,
            m.title,
            h.name,
            st.show_date,
            st.show_time,
            b.ticket_status
    ";

    $detailsStmt = $pdo->prepare($detailsQuery);
    $detailsStmt->execute([$booking["id"]]);

    $details = $detailsStmt->fetch(PDO::FETCH_ASSOC);

    if (!$details) {
        $pdo->rollBack();

        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Unable to retrieve booking details."
        ]);
        exit;
    }

    // Check payment.
    if ($details["payment_status"] !== "Completed") {
        $pdo->rollBack();

        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Payment has not been completed for this booking."
        ]);
        exit;
    }

    // Check whether the showtime has already passed.
    $showDateTime = strtotime(
        $details["show_date"] . " " . $details["show_time"]
    );

    if ($showDateTime === false || $showDateTime < time()) {
        $pdo->rollBack();

        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "This ticket has expired because the showtime has passed."
        ]);
        exit;
    }

    // Mark the entire booking ticket as used.
    $updateQuery = "
        UPDATE bookings
        SET ticket_status = 'Used'
        WHERE id = ?
          AND ticket_status = 'Valid'
    ";

    $updateStmt = $pdo->prepare($updateQuery);
    $updateStmt->execute([$booking["id"]]);

    if ($updateStmt->rowCount() !== 1) {
        $pdo->rollBack();

        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Ticket could not be verified. It may already have been used."
        ]);
        exit;
    }

    // Commit successful verification.
    $pdo->commit();

    $details["ticket_status"] = "Used";

    echo json_encode([
        "success" => true,
        "message" => "Ticket verified successfully.",
        "booking" => $details
    ]);

} catch (PDOException $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error while verifying ticket."
    ]);

} catch (Exception $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "An unexpected error occurred."
    ]);
}