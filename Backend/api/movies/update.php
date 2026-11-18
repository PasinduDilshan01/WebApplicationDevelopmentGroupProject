<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

header("Content-Type: application/json");

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


// ADMIN AUTHENTICATION

if (
    !isset($_SESSION["user_id"]) ||
    ($_SESSION["role"] ?? "") !== "admin"
) {

    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Admin access required."
    ]);

    exit;
}


// REQUEST METHOD

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}


// READ FORM DATA

$id = (int)($_POST["id"] ?? 0);

$title = trim($_POST["title"] ?? "");

$director = trim($_POST["director"] ?? "");

$releaseDate = $_POST["release_date"] ?? "";

$genre = trim($_POST["genre"] ?? "");

$duration = (int)($_POST["duration"] ?? 0);

$rating = $_POST["rating"] ?? "";

$certificate = trim($_POST["certificate"] ?? "");

$status = $_POST["status"] ?? "";


// VALIDATE REQUIRED DATA

if (
    $id <= 0 ||
    $title === "" ||
    $director === "" ||
    $releaseDate === "" ||
    !preg_match('/^\d{4}-\d{2}-\d{2}$/', $releaseDate) ||
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


// VALIDATE DATE

$dateObject = DateTime::createFromFormat("Y-m-d", $releaseDate);

if (!$dateObject || $dateObject->format("Y-m-d") !== $releaseDate) {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Invalid release date."
    ]);

    exit;
}


// VALIDATE RATING

if ($rating === "") {

    $rating = null;

} else {

    $rating = (float)$rating;

    if ($rating < 0 || $rating > 10) {

        http_response_code(422);

        echo json_encode([
            "success" => false,
            "message" => "Rating must be between 0 and 10."
        ]);

        exit;
    }
}


// ALLOWED GENRES

$allowedGenres = [
    "Action",
    "Adventure",
    "Animation",
    "Crime",
    "Drama",
    "Family",
    "Fantasy",
    "Horror",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Thriller"
];

if (!in_array($genre, $allowedGenres, true)) {

    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Please select a valid movie genre."
    ]);

    exit;
}


try {

    $database = new Database();

    $pdo = $database->connect();


    // CHECK MOVIE

    $checkMovie = $pdo->prepare("
        SELECT id, poster
        FROM movies
        WHERE id = ?
    ");

    $checkMovie->execute([$id]);

    $existingMovie = $checkMovie->fetch(PDO::FETCH_ASSOC);


    if (!$existingMovie) {

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Movie not found."
        ]);

        exit;
    }


    // KEEP EXISTING POSTER BY DEFAULT

    $posterPath = $existingMovie["poster"] ?? "";

    $uploadedFilePath = null;


    $uploadDirectory = __DIR__ . "/../../uploads/posters/";


    if (!is_dir($uploadDirectory)) {

        if (!mkdir($uploadDirectory, 0755, true)) {

            throw new Exception("Unable to create poster upload directory.");
        }

    }


    // CHECK WHETHER A NEW POSTER WAS UPLOADED

    if (
        isset($_FILES["poster"]) &&
        $_FILES["poster"]["error"] !== UPLOAD_ERR_NO_FILE
    ) {

        $file = $_FILES["poster"];


        if ($file["error"] !== UPLOAD_ERR_OK) {

            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "Poster upload failed."
            ]);

            exit;
        }


        if ($file["size"] > 5 * 1024 * 1024) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Poster image must be smaller than 5 MB."
            ]);

            exit;
        }


        // VERIFY IMAGE

        $imageInfo = @getimagesize($file["tmp_name"]);

        if ($imageInfo === false) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Uploaded file is not a valid image."
            ]);

            exit;
        }


        $finfo = new finfo(FILEINFO_MIME_TYPE);

        $mimeType = $finfo->file($file["tmp_name"]);


        $allowedTypes = [
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/webp" => "webp"
        ];


        if (!isset($allowedTypes[$mimeType])) {

            http_response_code(422);

            echo json_encode([
                "success" => false,
                "message" => "Only JPG, PNG and WEBP images are allowed."
            ]);

            exit;
        }


        // UNIQUE FILE NAME

        $fileName = bin2hex(random_bytes(16))
            . "."
            . $allowedTypes[$mimeType];


        $destination = $uploadDirectory . $fileName;


        if (!move_uploaded_file($file["tmp_name"], $destination)) {

            throw new Exception("Unable to save poster image.");
        }


        $posterPath = "uploads/posters/" . $fileName;

        $uploadedFilePath = $destination;

    }


    $pdo->beginTransaction();


    // UPDATE MOVIE

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
        $releaseDate,
        $duration,
        $rating,
        $certificate,
        $status,
        $posterPath,
        $id

    ]);


    // REMOVE OLD GENRE CONNECTIONS

    $deleteGenres = $pdo->prepare("
        DELETE FROM movie_genres
        WHERE movie_id = ?
    ");

    $deleteGenres->execute([$id]);


    // FIND SELECTED GENRE

    $findGenre = $pdo->prepare("
        SELECT id
        FROM genres
        WHERE name = ?
    ");

    $findGenre->execute([$genre]);

    $genreId = $findGenre->fetchColumn();


    // CREATE GENRE IF REQUIRED

    if (!$genreId) {

        $insertGenre = $pdo->prepare("
            INSERT INTO genres (name)
            VALUES (?)
        ");

        $insertGenre->execute([$genre]);

        $genreId = $pdo->lastInsertId();

    }


    // CONNECT MOVIE AND GENRE

    $linkGenre = $pdo->prepare("
        INSERT INTO movie_genres
        (movie_id, genre_id)
        VALUES (?, ?)
    ");

    $linkGenre->execute([

        $id,
        $genreId

    ]);


    $pdo->commit();


    echo json_encode([

        "success" => true,

        "message" => "Movie updated successfully.",

        "poster" => $posterPath

    ]);


} catch (Throwable $e) {

    if (isset($pdo) && $pdo->inTransaction()) {

        $pdo->rollBack();

    }


    // REMOVE NEW IMAGE IF UPDATE FAILED

    if (
        isset($uploadedFilePath) &&
        $uploadedFilePath &&
        file_exists($uploadedFilePath)
    ) {

        unlink($uploadedFilePath);

    }


    error_log("Movie Update Error: " . $e->getMessage());


    http_response_code(500);


    echo json_encode([

        "success" => false,

        "message" => "Movie update failed."

    ]);

}

?>