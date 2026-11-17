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

    // Retrieve payment transactions
    $sql = "
        SELECT
            p.id AS id,
            p.booking_id,
            p.transaction_reference AS reference,
            b.booking_reference AS bookingReference,
            u.name AS customer,
            u.email,
            p.payment_method AS method,
            p.amount,
            p.payment_status AS status,
            p.created_at AS date

        FROM payments p

        INNER JOIN bookings b
            ON p.booking_id = b.id

        INNER JOIN users u
            ON b.user_id = u.id

        ORDER BY p.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $payments = $stmt->fetchAll();

    echo json_encode([
        "success" => true,
        "payments" => $payments
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve payment transactions."
    ]);

}

?>