<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check customer login
if (!isset($_SESSION["user_id"])) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Please log in to view your bookings."
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

try {

    // Database connection
    $database = new Database();
    $pdo = $database->connect();

    $userId = $_SESSION["user_id"];

    // Retrieve customer bookings
    $sql = "

        SELECT

            b.id AS booking_id,
            b.booking_reference,
            b.total_amount,
            b.status AS booking_status,
            b.created_at AS booking_date,

            b.ticket_code,
            b.ticket_status,

            u.name AS customer_name,

            m.id AS movie_id,
            m.title AS movie_title,
            m.poster,

            h.name AS hall_name,

            st.show_date,
            st.show_time,

            GROUP_CONCAT(
                s.seat_number
                ORDER BY s.seat_number
                SEPARATOR ', '
            ) AS seats,

            p.payment_method,
            p.transaction_reference,
            p.payment_status

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

        LEFT JOIN payments p
            ON b.id = p.booking_id

        WHERE b.user_id = ?

        GROUP BY

            b.id,
            b.booking_reference,
            b.total_amount,
            b.status,
            b.created_at,

            b.ticket_code,
            b.ticket_status,

            u.name,

            m.id,
            m.title,
            m.poster,

            h.name,

            st.show_date,
            st.show_time,

            p.payment_method,
            p.transaction_reference,
            p.payment_status

        ORDER BY b.created_at DESC

    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([$userId]);

    $bookings = $stmt->fetchAll();

    // Return booking information
    echo json_encode([

        "success" => true,

        "bookings" => $bookings

    ]);

} catch (PDOException $e) {

    error_log(
        "My Bookings Error: " . $e->getMessage()
    );

    http_response_code(500);

    echo json_encode([

        "success" => false,

        "message" => "Unable to retrieve your booking history."

    ]);

}

?>