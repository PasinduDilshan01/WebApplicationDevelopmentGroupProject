<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// CHECK ADMIN ACCESS
if (
    !isset($_SESSION["user_id"]) ||
    !isset($_SESSION["role"]) ||
    $_SESSION["role"] !== "admin"
) {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Admin access required."
    ]);

    exit;
}

// ONLY ALLOW GET REQUESTS
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
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

    $sql = "
        SELECT
            u.id,
            u.name,
            u.email,
            u.phone,
            u.created_at AS joined,
            u.status,

            COUNT(
                DISTINCT CASE
                    WHEN b.status != 'Cancelled' THEN b.id
                END
            ) AS bookings,

            COALESCE(
                SUM(
                    CASE
                        WHEN b.status = 'Confirmed'
                        THEN b.total_amount
                        ELSE 0
                    END
                ),
                0
            ) AS spent

        FROM users u

        LEFT JOIN bookings b
            ON u.id = b.user_id

        WHERE u.role = 'user'

        GROUP BY
            u.id,
            u.name,
            u.email,
            u.phone,
            u.created_at,
            u.status

        ORDER BY u.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $customers = $stmt->fetchAll();

    echo json_encode([
        "success" => true,
        "customers" => $customers
    ]);

} catch (Throwable $e) {

    error_log("Customer list error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve customer accounts."
    ]);
}

?>