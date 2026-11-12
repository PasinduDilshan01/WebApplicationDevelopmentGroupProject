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
                GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', '),
                ''
            ) AS genre
         FROM movies m
         LEFT JOIN movie_genres mg ON m.id = mg.movie_id
         LEFT JOIN genres g ON mg.genre_id = g.id
         GROUP BY m.id
         ORDER BY m.created_at DESC"
    );

    $stmt->execute();

    echo json_encode([
        "success" => true,
        "movies" => $stmt->fetchAll()
    ]);

} catch (PDOException $e) {

    error_log("Movies list error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve movies."
    ]);
}
