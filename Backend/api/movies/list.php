<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

try {

    $database = new Database();
    $conn = $database->connect();

    $stmt = $conn->prepare(
        "SELECT
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
            ) AS genre,

            COALESCE(
                AVG(r.rating),
                0
            ) AS customer_rating,

            COUNT(DISTINCT r.id) AS total_reviews

         FROM movies m

         LEFT JOIN movie_genres mg
            ON m.id = mg.movie_id

         LEFT JOIN genres g
            ON mg.genre_id = g.id

         LEFT JOIN reviews r
            ON m.id = r.movie_id

         GROUP BY m.id

         ORDER BY m.created_at DESC"
    );

    $stmt->execute();

    $movies = $stmt->fetchAll();

    foreach ($movies as &$movie) {

        $movie["customer_rating"] =
            round((float) $movie["customer_rating"], 1);

        $movie["total_reviews"] =
            (int) $movie["total_reviews"];

    }

    unset($movie);

    echo json_encode([
        "success" => true,
        "movies" => $movies
    ]);

} catch (PDOException $e) {

    error_log("Movies list error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve movies."
    ]);

}

?>