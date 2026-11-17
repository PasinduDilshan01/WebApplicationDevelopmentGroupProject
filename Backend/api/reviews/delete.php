<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

session_start();

// Check customer authentication
if (!isset($_SESSION["user_id"])) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Please log in to delete your review."
    ]);

    exit;
}

// Allow only DELETE requests
if ($_SERVER["REQUEST_METHOD"] !== "DELETE") {
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

    // Validate review ID
    if ($reviewId <= 0) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Valid review ID is required."
        ]);

        exit;
    }

    // Check customer account
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

    // Delete only the review belonging to this customer
    $deleteStmt = $pdo->prepare("
        DELETE FROM reviews
        WHERE id = ? AND user_id = ?
    ");

    $deleteStmt->execute([
        $reviewId,
        $userId
    ]);

    if ($deleteStmt->rowCount() === 0) {
        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Review not found or you do not have permission to delete it."
        ]);

        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Your review was deleted successfully."
    ]);

} catch (PDOException $e) {

    error_log("Review deletion error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to delete review."
    ]);

}

?>