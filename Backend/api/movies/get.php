<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {

    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

$id = $_GET["id"] ?? null;

if (
    !$id ||
    !filter_var($id, FILTER_VALIDATE_INT) ||
    $id <= 0
) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Valid movie ID is required."
    ]);

    exit;
}

try {

    $database = new Database();
    $pdo = $database->connect();

    $sql = "
        SELECT
            m.id,
            m.title,
            m.director,
            m.release_date,
            m.duration,
            m.rating,
            m.certificate,
            m.status,
            m.poster,

            COALESCE(
                GROUP_CONCAT(
                    DISTINCT g.name
                    ORDER BY g.name
                    SEPARATOR ', '
                ),
                ''
            ) AS genres

        FROM movies m

        LEFT JOIN movie_genres mg
            ON m.id = mg.movie_id

        LEFT JOIN genres g
            ON mg.genre_id = g.id

        WHERE m.id = ?

        GROUP BY
            m.id,
            m.title,
            m.director,
            m.release_date,
            m.duration,
            m.rating,
            m.certificate,
            m.status,
            m.poster

        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([$id]);

    $movie = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$movie) {

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Movie not found."
        ]);

        exit;
    }

    echo json_encode([
        "success" => true,
        "movie" => $movie
    ]);

} catch (Throwable $e) {

    error_log("Movie details error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve movie details."
    ]);

}

?>