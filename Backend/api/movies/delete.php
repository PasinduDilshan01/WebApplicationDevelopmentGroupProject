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

    // Check movie exists
    $check = $conn->prepare(
        "SELECT id FROM movies WHERE id = ?"
    );

    $check->execute([$movieId]);

    if (!$check->fetch()) {
        $conn->rollBack();

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Movie not found."
        ]);
        exit;
    }

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

    // Delete movie
    $delete = $conn->prepare(
        "DELETE FROM movies WHERE id = ?"
    );

    $delete->execute([$movieId]);

    if ($delete->rowCount() !== 1) {
        throw new Exception("Movie record was not deleted.");
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Movie permanently deleted from database.",
        "deleted_id" => $movieId
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
