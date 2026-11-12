<?php

require_once __DIR__ . "/../config/cors.php";
require_once __DIR__ ."/../../config/database.php";
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION["user_id"])) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Not authenticated."
    ]);

    exit;
}

try {

    $database = new Database();
    $conn = $database->connect();

    $stmt = $conn->prepare(
        "SELECT id, name, email, phone, role, status
         FROM users
         WHERE id = ?"
    );

    $stmt->execute([$_SESSION["user_id"]]);

    $user = $stmt->fetch();

    if (!$user || $user["status"] !== "Active") {

        $_SESSION = [];
        session_destroy();

        http_response_code(401);

        echo json_encode([
            "success" => false,
            "message" => "Account unavailable."
        ]);

        exit;
    }

    unset($user["status"]);

    echo json_encode([
        "success" => true,
        "user" => $user
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve profile."
    ]);

}

?>