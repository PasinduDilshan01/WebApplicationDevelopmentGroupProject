<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

session_start();

// Verify administrator
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

// Allow DELETE only
if ($_SERVER["REQUEST_METHOD"] !== "DELETE") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$movieId = (int)($data["id"] ?? 0);

if ($movieId <= 0) {
    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Invalid movie ID."
    ]);
    exit;
}

try {

    $database = new Database();
    $conn = $database->connect();

    $conn->beginTransaction();

    // Retrieve movie and poster path
    $check = $conn->prepare(
        "SELECT id, poster FROM movies WHERE id = ?"
    );

    $check->execute([$movieId]);

    $movie = $check->fetch(PDO::FETCH_ASSOC);

    if (!$movie) {
        $conn->rollBack();

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Movie not found."
        ]);
        exit;
    }

    $posterPath = $movie["poster"];

    // Prevent deletion if showtimes exist
    $showtimes = $conn->prepare(
        "SELECT id FROM showtimes WHERE movie_id = ? LIMIT 1"
    );

    $showtimes->execute([$movieId]);

    if ($showtimes->fetch()) {
        $conn->rollBack();

        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" => "Cannot delete movie because it has scheduled showtimes."
        ]);
        exit;
    }

    // Delete genre associations
    $genres = $conn->prepare(
        "DELETE FROM movie_genres WHERE movie_id = ?"
    );

    $genres->execute([$movieId]);

    // Delete movie record
    $delete = $conn->prepare(
        "DELETE FROM movies WHERE id = ?"
    );

    $delete->execute([$movieId]);

    if ($delete->rowCount() !== 1) {
        throw new Exception("Movie record was not deleted.");
    }

    // Commit database changes first
    $conn->commit();

    // Delete poster image after successful database deletion
    $posterDeleted = false;

    if (!empty($posterPath)) {

        // Only allow deletion from Backend/uploads/posters/
        $posterDirectory = realpath(
            __DIR__ . "/../../uploads/posters"
        );

        if ($posterDirectory !== false) {

            $fileName = basename($posterPath);

            $fullPosterPath = $posterDirectory . DIRECTORY_SEPARATOR . $fileName;

            // Confirm the file is inside the poster directory
            $realPosterPath = realpath($fullPosterPath);

            if (
                $realPosterPath !== false &&
                strpos(
                    $realPosterPath,
                    $posterDirectory . DIRECTORY_SEPARATOR
                ) === 0
            ) {

                // Do not delete an image still used by another movie
                $sharedPoster = $conn->prepare(
                    "SELECT id FROM movies WHERE poster = ? LIMIT 1"
                );

                $sharedPoster->execute([$posterPath]);

                if (!$sharedPoster->fetch()) {
                    $posterDeleted = unlink($realPosterPath);
                }
            }
        }
    }

    echo json_encode([
        "success" => true,
        "message" => $posterDeleted
            ? "Movie and poster image successfully deleted."
            : "Movie deleted successfully. Poster image was not deleted or was not found.",
        "deleted_id" => $movieId,
        "poster_deleted" => $posterDeleted
    ]);

} catch (Throwable $e) {

    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log("Movie deletion error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Database deletion failed."
    ]);
}