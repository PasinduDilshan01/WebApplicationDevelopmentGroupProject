<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

session_start();

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

if (!isset($_GET["movie_id"]) || !is_numeric($_GET["movie_id"])) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Valid movie ID is required."
    ]);

    exit;
}

try {

    $database = new Database();
    $pdo = $database->connect();

    $movieId = (int) $_GET["movie_id"];

    $userId = isset($_SESSION["user_id"])
        ? (int) $_SESSION["user_id"]
        : 0;

    $sql = "
        SELECT
            r.id,
            r.user_id,
            r.movie_id,
            r.rating,
            r.comment,
            r.created_at,
            u.name AS customer,

            CASE
                WHEN r.user_id = ? THEN 1
                ELSE 0
            END AS is_mine

        FROM reviews r

        INNER JOIN users u ON r.user_id = u.id

        WHERE r.movie_id = ?

        ORDER BY r.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        $userId,
        $movieId
    ]);

    $reviews = $stmt->fetchAll();

    foreach ($reviews as &$review) {
        $review["is_mine"] = (bool) $review["is_mine"];
    }

    unset($review);

    echo json_encode([
        "success" => true,
        "reviews" => $reviews
    ]);

} catch (PDOException $e) {

    error_log("Movie reviews error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve movie reviews."
    ]);

}

?>