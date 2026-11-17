<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check authentication
if (!isset($_SESSION["user_id"])) {

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Not authenticated."
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

// Get submitted data
$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data["name"] ?? "");
$phone = trim($data["phone"] ?? "");

// Validate name
if ($name === "") {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Name is required."
    ]);

    exit;
}

try {

    // Connect to database
    $database = new Database();
    $pdo = $database->connect();

    // Check customer account
    $check = $pdo->prepare(
        "SELECT id, status
         FROM users
         WHERE id = ?"
    );

    $check->execute([$_SESSION["user_id"]]);

    $user = $check->fetch();

    if (!$user || $user["status"] !== "Active") {

        http_response_code(401);

        echo json_encode([
            "success" => false,
            "message" => "Account unavailable."
        ]);

        exit;
    }

    // Update customer information
    $stmt = $pdo->prepare(
        "UPDATE users
         SET name = ?, phone = ?
         WHERE id = ?"
    );

    $stmt->execute([
        $name,
        $phone,
        $_SESSION["user_id"]
    ]);

    // Retrieve updated profile
    $profile = $pdo->prepare(
        "SELECT id, name, email, phone, role
         FROM users
         WHERE id = ?"
    );

    $profile->execute([$_SESSION["user_id"]]);

    $updatedUser = $profile->fetch();

    echo json_encode([
        "success" => true,
        "message" => "Profile updated successfully.",
        "user" => $updatedUser
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to update profile."
    ]);

}

?>