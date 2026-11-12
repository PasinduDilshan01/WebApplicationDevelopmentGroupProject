<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

session_start();

if (
    !isset($_SESSION["user_id"]) ||
    ($_SESSION["role"] ?? "") !== "admin"
) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Administrator access required."
    ]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$title = trim($data["title"] ?? "");
$director = trim($data["director"] ?? "");
$releaseDate = $data["release_date"] ?? "";
$duration = (int)($data["duration"] ?? 0);
$rating = $data["rating"] ?? null;
$certificate = trim($data["certificate"] ?? "");
$status = $data["status"] ?? "Coming Soon";
$poster = trim($data["poster"] ?? "");
$genres = $data["genre"] ?? "";

if (
    $title === "" ||
    $director === "" ||
    $releaseDate === "" ||
    !preg_match('/^\d{4}-\d{2}-\d{2}$/', $releaseDate) ||
    $duration <= 0 ||
    $certificate === "" ||
    !in_array($status, ["Now Showing", "Coming Soon"], true) ||
    !is_string($genres)
) {
    http_response_code(422);
    echo json_encode([
        "success" => false,
        "message" => "Please provide valid movie details."
    ]);
    exit;
}

try {
    $database = new Database();
    $conn = $database->connect();

    $conn->beginTransaction();

    $stmt = $conn->prepare(
        "INSERT INTO movies
        (title, director, release_date, duration, rating,
         certificate, status, poster)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );

    $stmt->execute([
        $title,
        $director,
        $releaseDate,
        $duration,
        $rating === "" ? null : $rating,
        $certificate,
        $status,
        $poster
    ]);

    $movieId = $conn->lastInsertId();

    $genreNames = array_unique(array_filter(
        array_map("trim", explode(",", $genres))
    ));

    foreach ($genreNames as $genreName) {

        $findGenre = $conn->prepare(
            "SELECT id FROM genres WHERE name = ?"
        );

        $findGenre->execute([$genreName]);
        $genre = $findGenre->fetch();

        if (!$genre) {
            $insertGenre = $conn->prepare(
                "INSERT INTO genres (name) VALUES (?)"
            );

            $insertGenre->execute([$genreName]);
            $genreId = $conn->lastInsertId();

        } else {
            $genreId = $genre["id"];
        }

        $linkGenre = $conn->prepare(
            "INSERT INTO movie_genres (movie_id, genre_id)
             VALUES (?, ?)"
        );

        $linkGenre->execute([$movieId, $genreId]);
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Movie added successfully.",
        "movie_id" => $movieId
    ]);

} catch (Throwable $e) {

    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log("Add movie error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to add movie."
    ]);
}
