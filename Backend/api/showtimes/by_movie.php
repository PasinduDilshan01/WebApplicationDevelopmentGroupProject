<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

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

    $movieId = isset($_GET["movie_id"])
        ? (int) $_GET["movie_id"]
        : 0;

    if ($movieId <= 0) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Invalid movie ID."
        ]);

        exit;
    }

    $sql = "
        SELECT
            st.id,
            st.movie_id,
            st.hall_id,
            h.name AS hall,
            st.show_date,
            st.show_time,
            st.ticket_price

        FROM showtimes st

        INNER JOIN cinema_halls h
            ON st.hall_id = h.id

        WHERE st.movie_id = ?
        AND st.show_date >= CURDATE()
        AND h.status = 'Active'

        ORDER BY st.show_date ASC, st.show_time ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$movieId]);

    echo json_encode([
        "success" => true,
        "showtimes" => $stmt->fetchAll()
    ]);

} catch (PDOException $e) {

    error_log("Movie showtimes error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve showtimes."
    ]);

}

?>