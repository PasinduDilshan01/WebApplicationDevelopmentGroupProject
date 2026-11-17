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

// Get movie ID
$movie_id = $_GET["movie_id"] ?? null;

// Validate movie ID
if (
    !$movie_id ||
    !filter_var($movie_id, FILTER_VALIDATE_INT) ||
    $movie_id <= 0
) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Valid movie ID is required."
    ]);

    exit;
}

try {

    // Connect to database
    $database = new Database();
    $pdo = $database->connect();

    // Retrieve upcoming showtimes for the selected movie
    $sql = "
        SELECT
            st.id,
            st.movie_id,
            st.hall_id,
            ch.name AS hall,
            st.show_date,
            st.show_time,
            st.ticket_price

        FROM showtimes st

        INNER JOIN cinema_halls ch
            ON st.hall_id = ch.id

        WHERE st.movie_id = ?
        AND st.show_date >= CURDATE()
        AND ch.status = 'Active'

        ORDER BY
            st.show_date ASC,
            st.show_time ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$movie_id]);

    $showtimes = $stmt->fetchAll();

    // Return showtimes
    echo json_encode([
        "success" => true,
        "showtimes" => $showtimes
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve showtimes."
    ]);

}

?>