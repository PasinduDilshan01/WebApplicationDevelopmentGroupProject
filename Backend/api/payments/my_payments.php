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
        "message" => "Please log in to view your payments."
    ]);

    exit;
}

// Allow GET only
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
            p.id AS payment_id,
            p.booking_id,
            p.payment_method,
            p.transaction_reference,
            p.amount,
            p.payment_status,
            p.created_at AS payment_date,

            b.booking_reference,

            m.title AS movie_title,

            st.show_date,
            st.show_time,

            ch.name AS hall_name

        FROM payments p

        INNER JOIN bookings b
            ON p.booking_id = b.id

        INNER JOIN showtimes st
            ON b.showtime_id = st.id

        INNER JOIN movies m
            ON st.movie_id = m.id

        INNER JOIN cinema_halls ch
            ON st.hall_id = ch.id

        WHERE b.user_id = ?

        ORDER BY p.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        $_SESSION["user_id"]
    ]);

    $payments = $stmt->fetchAll();

    echo json_encode([
        "success" => true,
        "payments" => $payments
    ]);

} catch (PDOException $e) {

    error_log("Payment history error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to load payment history."
    ]);

}

?>