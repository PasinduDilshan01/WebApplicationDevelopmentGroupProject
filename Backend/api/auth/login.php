<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ ."/../../config/database.php";

session_start();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$email = strtolower(trim($data["email"] ?? ""));
$password = $data["password"] ?? "";

try {

    $database = new Database();
    $conn = $database->connect();

    $stmt = $conn->prepare(
        "SELECT id, name, email, password, role, status
         FROM users
         WHERE email = ?"
    );

    $stmt->execute([$email]);

    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user["password"])) {

        http_response_code(401);

        echo json_encode([
            "success" => false,
            "message" => "Invalid email or password."
        ]);

        exit;
    }

    if ($user["status"] !== "Active") {

        http_response_code(403);

        echo json_encode([
            "success" => false,
            "message" => "Your account is suspended."
        ]);

        exit;
    }

    session_regenerate_id(true);

    $_SESSION["user_id"] = $user["id"];
    $_SESSION["role"] = $user["role"];

    unset($user["password"]);
    unset($user["status"]);

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