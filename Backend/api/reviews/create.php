<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

session_start();

// Check customer authentication
if (!isset($_SESSION["user_id"])) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Please log in to submit a review."
    ]);

    exit;
}

// Allow only POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
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

    $userId = (int) $_SESSION["user_id"];

    // Read JSON request
    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Invalid request data."
        ]);

        exit;
    }

    $movieId = isset($data["movie_id"])
        ? (int) $data["movie_id"]
        : 0;

    $rating = isset($data["rating"])
        ? (int) $data["rating"]
        : 0;

    $comment = trim($data["comment"] ?? "");


    // Validate movie ID
    if ($movieId <= 0) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Valid movie ID is required."
        ]);

        exit;
    }


    // Validate rating
    if ($rating < 1 || $rating > 5) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Rating must be between 1 and 5."
        ]);

        exit;
    }


    // Validate comment
    if ($comment === "") {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Please enter a review comment."
        ]);

        exit;
    }


    // Check active customer account
    $userStmt = $pdo->prepare("
        SELECT id
        FROM users
        WHERE id = ? AND status = 'Active'
    ");

    $userStmt->execute([$userId]);

    if (!$userStmt->fetch()) {
        http_response_code(403);

        echo json_encode([
            "success" => false,
            "message" => "Your account is not active."
        ]);

        exit;
    }


    // Check whether movie exists
    $movieStmt = $pdo->prepare("
        SELECT id
        FROM movies
        WHERE id = ?
    ");

    $movieStmt->execute([$movieId]);

    if (!$movieStmt->fetch()) {
        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Movie not found."
        ]);

        exit;
    }


    // Check whether customer already reviewed this movie
    $checkStmt = $pdo->prepare("
        SELECT id
        FROM reviews
        WHERE user_id = ? AND movie_id = ?
        LIMIT 1
    ");

    $checkStmt->execute([
        $userId,
        $movieId
    ]);

    if ($checkStmt->fetch()) {
        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" => "You have already reviewed this movie. You can edit your existing review instead."
        ]);

        exit;
    }


    // Insert review
    $sql = "
        INSERT INTO reviews (
            user_id,
            movie_id,
            rating,
            comment
        )
        VALUES (?, ?, ?, ?)
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        $userId,
        $movieId,
        $rating,
        $comment
    ]);


    echo json_encode([
        "success" => true,
        "message" => "Your review was submitted successfully.",
        "review_id" => $pdo->lastInsertId()
    ]);

} catch (PDOException $e) {

    error_log("Review submission error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to submit review."
    ]);

}

?>