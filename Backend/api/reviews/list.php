<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

session_start();

// Check admin authentication
if (!isset($_SESSION["user_id"]) || $_SESSION["role"] !== "admin") {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Unauthorized access."
    ]);

    exit;
}

// Allow only GET requests
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

try {

    // Connect to database
    $database = new Database();
    $pdo = $database->connect();

    // Retrieve reviews with customer and movie details
    $sql = "
        SELECT
            r.id,
            r.user_id,
            r.movie_id,
            r.rating,
            r.comment,
            r.created_at,
            u.name AS customer,
            u.email,
            m.title AS movie

        FROM reviews r

        INNER JOIN users u ON r.user_id = u.id
        INNER JOIN movies m ON r.movie_id = m.id

        ORDER BY r.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $reviews = $stmt->fetchAll();

    echo json_encode([
        "success" => true,
        "reviews" => $reviews
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve reviews."
    ]);

}

?>