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

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
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

    $sql = "
        SELECT
            b.id,
            b.booking_reference,
            b.created_at,
            b.total_amount,
            b.status,

            u.email AS customer,

            m.title AS movie,

            ch.name AS screening,

            st.show_date,
            st.show_time,

            COALESCE(
                GROUP_CONCAT(
                    DISTINCT s.seat_number
                    ORDER BY s.seat_number
                    SEPARATOR ', '
                ),
                ''
            ) AS seats,

            COALESCE(p.payment_method, 'Not recorded') AS payment

        FROM bookings b

        INNER JOIN users u
            ON b.user_id = u.id

        INNER JOIN showtimes st
            ON b.showtime_id = st.id

        INNER JOIN movies m
            ON st.movie_id = m.id

        INNER JOIN cinema_halls ch
            ON st.hall_id = ch.id

        LEFT JOIN booking_seats bs
            ON b.id = bs.booking_id

        LEFT JOIN seats s
            ON bs.seat_id = s.id

        LEFT JOIN (
            SELECT
                booking_id,
                MAX(payment_method) AS payment_method
            FROM payments
            GROUP BY booking_id
        ) p
            ON b.id = p.booking_id

        GROUP BY
            b.id,
            b.booking_reference,
            b.created_at,
            b.total_amount,
            b.status,
            u.email,
            m.title,
            ch.name,
            st.show_date,
            st.show_time,
            p.payment_method

        ORDER BY b.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $bookings = $stmt->fetchAll();

    echo json_encode([
        "success" => true,
        "bookings" => $bookings
    ]);

} catch (Throwable $e) {

    error_log("Booking ledger error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve booking records."
    ]);
}
?>