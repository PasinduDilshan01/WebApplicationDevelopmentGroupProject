<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

$database = new Database();
$pdo = $database->connect();

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION["user_id"]) || $_SESSION["role"] !== "admin") {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Admin access required."
    ]);

    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "PUT") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$id = isset($data["id"]) ? (int)$data["id"] : 0;

$title = trim($data["title"] ?? "");
$director = trim($data["director"] ?? "");
$release_date = $data["release_date"] ?? "";
$genre = trim($data["genre"] ?? "");
$duration = isset($data["duration"]) ? (int)$data["duration"] : 0;
$rating = ($data["rating"] ?? "") === "" ? null : (float)$data["rating"];
$certificate = trim($data["certificate"] ?? "");
$status = $data["status"] ?? "";
$poster = trim($data["poster"] ?? "");

if (
    $id <= 0 ||
    $title === "" ||
    $director === "" ||
    $release_date === "" ||
    $genre === "" ||
    $duration <= 0 ||
    $certificate === "" ||
    !in_array($status, ["Now Showing", "Coming Soon"], true)
) {
    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Please provide all required movie details."
    ]);

    exit;
}

if ($rating !== null && ($rating < 0 || $rating > 10)) {
    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Rating must be between 0 and 10."
    ]);

    exit;
}

try {

    $pdo->beginTransaction();

    // Check whether the movie exists
    $checkMovie = $pdo->prepare(
        "SELECT id FROM movies WHERE id = ?"
    );

    $checkMovie->execute([$id]);

    if (!$checkMovie->fetch()) {
        $pdo->rollBack();

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Movie not found."
        ]);

        exit;
    }

    // Update movie details
    $updateMovie = $pdo->prepare("
        UPDATE movies
        SET
            title = ?,
            director = ?,
            release_date = ?,
            duration = ?,
            rating = ?,
            certificate = ?,
            status = ?,
            poster = ?
        WHERE id = ?
    ");

    $updateMovie->execute([
        $title,
        $director,
        $release_date,
        $duration,
        $rating,
        $certificate,
        $status,
        $poster,
        $id
    ]);

    // Update movie genres
    $pdo->prepare(
        "DELETE FROM movie_genres WHERE movie_id = ?"
    )->execute([$id]);

    $genreNames = array_unique(
        array_filter(
            array_map("trim", explode(",", $genre))
        )
    );

    foreach ($genreNames as $genreName) {

        $findGenre = $pdo->prepare(
            "SELECT id FROM genres WHERE name = ?"
        );

        $findGenre->execute([$genreName]);

        $genreId = $findGenre->fetchColumn();

        if (!$genreId) {

            $insertGenre = $pdo->prepare(
                "INSERT INTO genres (name) VALUES (?)"
            );

            $insertGenre->execute([$genreName]);

            $genreId = $pdo->lastInsertId();
        }

        $linkGenre = $pdo->prepare("
            INSERT INTO movie_genres (movie_id, genre_id)
            VALUES (?, ?)
        ");

        $linkGenre->execute([$id, $genreId]);
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Movie updated successfully."
    ]);

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Movie Update Error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Movie update failed.",
    ]);
}