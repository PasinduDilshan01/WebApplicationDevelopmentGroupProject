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
            st.id,
            st.movie_id,
            st.hall_id,
            m.title AS movie,
            ch.name AS hall,
            st.show_date AS date,
            st.show_time AS time,
            st.ticket_price AS price,

            COALESCE(
                ROUND(
                    COUNT(DISTINCT bs.seat_id) /
                    NULLIF(ch.total_seats, 0) * 100
                ),
                0
            ) AS occupancy

        FROM showtimes st

        INNER JOIN movies m
            ON st.movie_id = m.id

        INNER JOIN cinema_halls ch
            ON st.hall_id = ch.id

        LEFT JOIN bookings b
            ON b.showtime_id = st.id
            AND b.status IN ('Pending', 'Confirmed')

        LEFT JOIN booking_seats bs
            ON bs.booking_id = b.id

        GROUP BY
            st.id,
            st.movie_id,
            st.hall_id,
            m.title,
            ch.name,
            ch.total_seats,
            st.show_date,
            st.show_time,
            st.ticket_price

        ORDER BY st.show_date ASC, st.show_time ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $showtimes = $stmt->fetchAll();

    echo json_encode([
        "success" => true,
        "showtimes" => $showtimes
    ]);

} catch (Throwable $e) {

    error_log("Showtimes list error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve showtimes."
    ]);
}
?>