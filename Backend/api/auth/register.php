<?php
// Load configuration files using absolute paths
require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

session_start();

// Only allow POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed"
    ]);

    exit;
}

// Read JSON request
$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data["name"] ?? "");
$email = strtolower(trim($data["email"] ?? ""));
$phone = trim($data["phone"] ?? "");
$password = $data["password"] ?? "";

// Validate registration details
if (
    $name === "" ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    strlen($password) < 6
) {
    http_response_code(422);

    echo json_encode([
        "success" => false,
        "message" => "Please provide valid registration details."
    ]);

    exit;
}

try {

    $database = new Database();
    $conn = $database->connect();

    // Check whether email already exists
    $check = $conn->prepare(
        "SELECT id FROM users WHERE email = ?"
    );

    $check->execute([$email]);

    if ($check->fetch()) {

        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" => "Email already registered."
        ]);

        exit;
    }

    // Securely hash password
    $hashedPassword = password_hash(
        $password,
        PASSWORD_DEFAULT
    );

    // Register customer
    $stmt = $conn->prepare(
        "INSERT INTO users (name, email, phone, password, role)
         VALUES (?, ?, ?, ?, 'user')"
    );

    $stmt->execute([
        $name,
        $email,
        $phone,
        $hashedPassword
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Account created successfully."
    ]);

} catch (PDOException $e) {

    error_log("Registration error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Registration failed."
    ]);

}

