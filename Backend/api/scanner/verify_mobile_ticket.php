<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$sessionToken = $data["session_token"] ?? "";
$ticketCode = $data["ticket_code"] ?? "";

if (empty($sessionToken) || empty($ticketCode)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Scanner session token and ticket code are required."
    ]);
    exit;
}

try {
    $database = new Database();
    $pdo = $database->connect();

    $pdo->beginTransaction();

    // Verify and lock the scanner session.
    $sessionStmt = $pdo->prepare("
        SELECT ss.id, ss.admin_id
        FROM scanner_sessions ss
        INNER JOIN users u ON u.id = ss.admin_id
        WHERE ss.session_token = ?
          AND ss.status = 'Active'
          AND u.role = 'admin'
          AND u.status = 'Active'
        FOR UPDATE
    ");

    $sessionStmt->execute([$sessionToken]);
    $scannerSession = $sessionStmt->fetch(PDO::FETCH_ASSOC);

    if (!$scannerSession) {
        $pdo->rollBack();

        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Invalid or disconnected scanner session."
        ]);
        exit;
    }

    // Find and lock the booking using its unique ticket code.
    $bookingStmt = $pdo->prepare("
        SELECT
            b.id,
            b.booking_reference,
            b.total_amount,
            b.status AS booking_status,
            b.ticket_status,
            u.name AS customer_name,
            m.title AS movie_title,
            ch.name AS hall_name,
            st.show_date,
            st.show_time,
            GROUP_CONCAT(s.seat_number ORDER BY s.seat_number SEPARATOR ', ') AS seats,
            p.payment_method,
            p.payment_status
        FROM bookings b
        INNER JOIN users u ON u.id = b.user_id
        INNER JOIN showtimes st ON st.id = b.showtime_id
        INNER JOIN movies m ON m.id = st.movie_id
        INNER JOIN cinema_halls ch ON ch.id = st.hall_id
        LEFT JOIN booking_seats bs ON bs.booking_id = b.id
        LEFT JOIN seats s ON s.id = bs.seat_id
        LEFT JOIN payments p ON p.booking_id = b.id
        WHERE b.ticket_code = ?
        GROUP BY
            b.id,
            b.booking_reference,
            b.total_amount,
            b.status,
            b.ticket_status,
            u.name,
            m.title,
            ch.name,
            st.show_date,
            st.show_time,
            p.payment_method,
            p.payment_status
        FOR UPDATE
    ");

    $bookingStmt->execute([$ticketCode]);
    $booking = $bookingStmt->fetch(PDO::FETCH_ASSOC);

    $success = false;
    $message = "Ticket not found.";
    $scanStatus = "Invalid";

    if ($booking) {

        if ($booking["booking_status"] !== "Confirmed") {
            $message = "Booking is not confirmed.";
            $scanStatus = "Unconfirmed";

        } elseif ($booking["ticket_status"] === "Used") {
            $message = "This ticket has already been used.";
            $scanStatus = "Already Used";

        } elseif ($booking["payment_status"] !== "Completed") {
            $message = "Payment is not completed. Ticket cannot be accepted.";
            $scanStatus = "Payment Pending";

        } elseif (
            strtotime($booking["show_date"] . " " . $booking["show_time"]) < time()
        ) {
            $message = "This show has already started or finished.";
            $scanStatus = "Expired";

        } else {

            // Mark the ticket as used.
            $updateStmt = $pdo->prepare("
                UPDATE bookings
                SET ticket_status = 'Used'
                WHERE id = ? AND ticket_status = 'Valid'
            ");

            $updateStmt->execute([$booking["id"]]);

            if ($updateStmt->rowCount() === 1) {
                $success = true;
                $message = "Valid ticket. Entry approved.";
                $scanStatus = "Valid";
                $booking["ticket_status"] = "Used";
            } else {
                $message = "This ticket has already been used.";
                $scanStatus = "Already Used";
            }
        }
    }

    // Save the latest scan result for the admin dashboard.
    $resultData = [
        "success" => $success,
        "message" => $message,
        "booking" => $booking
    ];

    $resultJson = json_encode($resultData);

    $resultStmt = $pdo->prepare("
        UPDATE scanner_sessions
        SET
            last_scan_booking_id = ?,
            last_scan_status = ?,
            last_scan_message = ?,
            last_scan_data = ?
        WHERE id = ?
    ");

    $resultStmt->execute([
        $booking["id"] ?? null,
        $scanStatus,
        $message,
        $resultJson,
        $scannerSession["id"]
    ]);

    $pdo->commit();

    echo json_encode($resultData);

} catch (Exception $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "An error occurred while verifying the ticket."
    ]);
}