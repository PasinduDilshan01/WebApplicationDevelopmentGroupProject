<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

session_start();

// Allow only POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

// Get login data
$data = json_decode(file_get_contents("php://input"), true);

$email = strtolower(trim($data["email"] ?? ""));
$password = $data["password"] ?? "";

// Validate input
if (empty($email) || empty($password)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Email and password are required."
    ]);

    exit;
}

try {

    // Connect to database
    $database = new Database();
    $conn = $database->connect();

    // Find user by email
    $stmt = $conn->prepare(
        "SELECT id, name, email, password, role, status
         FROM users
         WHERE email = ?
         LIMIT 1"
    );

    $stmt->execute([$email]);

    $user = $stmt->fetch();

    // Check email and password
    if (!$user || !password_verify($password, $user["password"])) {

        http_response_code(401);

        echo json_encode([
            "success" => false,
            "message" => "Invalid email or password."
        ]);

        exit;
    }

    // Check account status
    if ($user["status"] !== "Active") {

        http_response_code(403);

        echo json_encode([
            "success" => false,
            "message" => $user["status"] === "Suspended"
                ? "Your account has been suspended. Please contact the administrator."
                : "Your account is not active."
        ]);

        exit;
    }

    // Regenerate session ID
    session_regenerate_id(true);

    // Store user information in session
    $_SESSION["user_id"] = $user["id"];
    $_SESSION["role"] = $user["role"];

    // Remove sensitive information
    unset($user["password"]);
    unset($user["status"]);

    // Successful login response
    echo json_encode([
        "success" => true,
        "message" => "Login successful.",
        "user" => $user
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Login failed."
    ]);

}

?>