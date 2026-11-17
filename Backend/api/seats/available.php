<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

// Allow only GET requests
if ($_SERVER["REQUEST_METHOD"] !== "GET") {

    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

// Get showtime ID
$showtime_id = $_GET["showtime_id"] ?? null;

// Validate showtime ID
if (
    !$showtime_id ||
    !filter_var($showtime_id, FILTER_VALIDATE_INT) ||
    $showtime_id <= 0
) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Valid showtime ID is required."
    ]);

    exit;
}

try {

    // Connect to database
    $database = new Database();
    $pdo = $database->connect();

    // Retrieve showtime information
    $showtimeSQL = "
        SELECT
            st.id,
            st.movie_id,
            st.hall_id,
            st.show_date,
            st.show_time,
            st.ticket_price,
            m.title AS movie,
            ch.name AS hall

        FROM showtimes st

        INNER JOIN movies m
            ON st.movie_id = m.id

        INNER JOIN cinema_halls ch
            ON st.hall_id = ch.id

        WHERE st.id = ?
        AND ch.status = 'Active'

        LIMIT 1
    ";

    $showtimeStmt = $pdo->prepare($showtimeSQL);
    $showtimeStmt->execute([$showtime_id]);

    $showtime = $showtimeStmt->fetch();

    // Check whether showtime exists
    if (!$showtime) {

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Showtime not found."
        ]);

        exit;
    }

    // Retrieve seats and their booking status
    $seatSQL = "
        SELECT
            s.id,
            s.hall_id,
            s.seat_number,

            CASE
                WHEN b.id IS NOT NULL THEN 'Booked'
                ELSE 'Available'
            END AS status

        FROM seats s

        LEFT JOIN booking_seats bs
            ON s.id = bs.seat_id

        LEFT JOIN bookings b
            ON bs.booking_id = b.id
            AND b.showtime_id = ?
            AND b.status IN ('Pending', 'Confirmed')

        WHERE s.hall_id = ?

        GROUP BY
            s.id,
            s.hall_id,
            s.seat_number,
            b.id

        ORDER BY s.seat_number ASC
    ";

    $seatStmt = $pdo->prepare($seatSQL);

    $seatStmt->execute([
        $showtime_id,
        $showtime["hall_id"]
    ]);

    $seats = $seatStmt->fetchAll();

    // Return seat information
    echo json_encode([
        "success" => true,
        "showtime" => $showtime,
        "seats" => $seats
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve available seats."
    ]);

}

?>