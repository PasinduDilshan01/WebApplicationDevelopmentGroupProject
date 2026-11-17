<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

session_start();

// Check customer authentication
if (!isset($_SESSION["user_id"])) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Please log in to edit your review."
    ]);

    exit;
}

// Allow only PUT requests
if ($_SERVER["REQUEST_METHOD"] !== "PUT") {
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

    $reviewId = isset($data["review_id"])
        ? (int) $data["review_id"]
        : 0;

    $rating = isset($data["rating"])
        ? (int) $data["rating"]
        : 0;

    $comment = trim($data["comment"] ?? "");


    // Validate review ID
    if ($reviewId <= 0) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Valid review ID is required."
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
            "message" => "Please enter your review comment."
        ]);

        exit;
    }


    // Check whether customer account is active
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


    // Check review ownership
    $checkStmt = $pdo->prepare("
        SELECT id
        FROM reviews
        WHERE id = ? AND user_id = ?
    ");

    $checkStmt->execute([
        $reviewId,
        $userId
    ]);

    if (!$checkStmt->fetch()) {
        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Review not found or you do not have permission to edit it."
        ]);

        exit;
    }


    // Update review
    $updateStmt = $pdo->prepare("
        UPDATE reviews
        SET
            rating = ?,
            comment = ?
        WHERE id = ? AND user_id = ?
    ");

    $updateStmt->execute([
        $rating,
        $comment,
        $reviewId,
        $userId
    ]);


    echo json_encode([
        "success" => true,
        "message" => "Your review was updated successfully."
    ]);

} catch (PDOException $e) {

    error_log("Review update error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to update review."
    ]);

}

?>