<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

header("Content-Type: application/json");

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check administrator access
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

// Only POST requests are allowed
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

// Receive form data
$title = trim($_POST["title"] ?? "");
$director = trim($_POST["director"] ?? "");
$releaseDate = $_POST["release_date"] ?? "";
$genre = trim($_POST["genre"] ?? "");
$duration = (int)($_POST["duration"] ?? 0);
$rating = $_POST["rating"] ?? "";
$certificate = trim($_POST["certificate"] ?? "");
$status = $_POST["status"] ?? "Coming Soon";

// Validate required fields
if (
    $title === "" ||
    $director === "" ||
    $releaseDate === "" ||
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

// Validate release date
$date = DateTime::createFromFormat("Y-m-d", $releaseDate);

if (!$date || $date->format("Y-m-d") !== $releaseDate) {
    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Invalid release date."
    ]);

    exit;
}

// Validate rating
if ($rating !== "" && (!is_numeric($rating) || $rating < 0 || $rating > 10)) {
    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Rating must be between 0 and 10."
    ]);

    exit;
}

$rating = $rating === "" ? null : (float)$rating;

// Poster upload
$posterPath = "";

try {

    if (isset($_FILES["poster"]) && $_FILES["poster"]["error"] !== UPLOAD_ERR_NO_FILE) {

        if ($_FILES["poster"]["error"] !== UPLOAD_ERR_OK) {
            throw new Exception("Poster upload failed.");
        }

        $poster = $_FILES["poster"];

        // Maximum file size: 5 MB
        if ($poster["size"] > 5 * 1024 * 1024) {
            throw new Exception("Poster image must be smaller than 5 MB.");
        }

        // Validate actual image type
        $imageInfo = getimagesize($poster["tmp_name"]);

        if ($imageInfo === false) {
            throw new Exception("Uploaded file is not a valid image.");
        }

        $allowedTypes = [
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/webp" => "webp"
        ];

        $mimeType = $imageInfo["mime"];

        if (!isset($allowedTypes[$mimeType])) {
            throw new Exception("Only JPG, PNG and WEBP images are allowed.");
        }

        // Create a unique filename
        $extension = $allowedTypes[$mimeType];

        $fileName = bin2hex(random_bytes(16)) . "." . $extension;

        // Upload directory
        $uploadDirectory = __DIR__ . "/../../uploads/posters/";

        if (!is_dir($uploadDirectory)) {
            if (!mkdir($uploadDirectory, 0755, true)) {
                throw new Exception("Unable to create poster upload folder.");
            }
        }

        $destination = $uploadDirectory . $fileName;

        if (!move_uploaded_file($poster["tmp_name"], $destination)) {
            throw new Exception("Unable to save poster image.");
        }

        // Save relative path in database
        $posterPath = "uploads/posters/" . $fileName;
    }

    // Database connection
    $database = new Database();
    $pdo = $database->connect();

    $pdo->beginTransaction();

    // Insert movie
    $movieStmt = $pdo->prepare("
        INSERT INTO movies (
            title,
            director,
            release_date,
            duration,
            rating,
            certificate,
            status,
            poster
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $movieStmt->execute([
        $title,
        $director,
        $releaseDate,
        $duration,
        $rating,
        $certificate,
        $status,
        $posterPath
    ]);

    $movieId = $pdo->lastInsertId();

    // Find or create genre
    $genreStmt = $pdo->prepare("
        SELECT id FROM genres WHERE name = ?
    ");

    $genreStmt->execute([$genre]);

    $genreId = $genreStmt->fetchColumn();

    if (!$genreId) {

        $insertGenre = $pdo->prepare("
            INSERT INTO genres (name) VALUES (?)
        ");

        $insertGenre->execute([$genre]);

        $genreId = $pdo->lastInsertId();
    }

    // Connect movie and genre
    $linkStmt = $pdo->prepare("
        INSERT INTO movie_genres (movie_id, genre_id)
        VALUES (?, ?)
    ");

    $linkStmt->execute([
        $movieId,
        $genreId
    ]);

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Movie added successfully.",
        "movie_id" => $movieId,
        "poster" => $posterPath
    ]);

} catch (Throwable $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    // Remove uploaded image if database operation failed
    if (!empty($destination) && file_exists($destination)) {
        unlink($destination);
    }

    error_log("Movie creation error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}