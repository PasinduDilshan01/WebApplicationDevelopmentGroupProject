<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check customer authentication
if (!isset($_SESSION["user_id"])) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Please log in to continue."
    ]);

    exit;
}

// Allow POST only
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

// Read request data
$data = json_decode(file_get_contents("php://input"), true);

$bookingId = isset($data["booking_id"])
    ? (int) $data["booking_id"]
    : 0;

$paymentMethod = $data["payment_method"] ?? "";

// Validate booking ID
if ($bookingId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Valid booking ID is required."
    ]);

    exit;
}

// Validate payment method
$allowedMethods = ["Card", "Cash"];

if (!in_array($paymentMethod, $allowedMethods, true)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid payment method."
    ]);

    exit;
}

try {

    $database = new Database();
    $pdo = $database->connect();

    $pdo->beginTransaction();

    $userId = $_SESSION["user_id"];

    // Find booking belonging to logged-in customer
    $bookingSQL = "
        SELECT
            id,
            booking_reference,
            user_id,
            total_amount,
            status
        FROM bookings
        WHERE id = ?
        AND user_id = ?
        FOR UPDATE
    ";

    $bookingStmt = $pdo->prepare($bookingSQL);

    $bookingStmt->execute([
        $bookingId,
        $userId
    ]);

    $booking = $bookingStmt->fetch();

    if (!$booking) {
        $pdo->rollBack();

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Booking not found."
        ]);

        exit;
    }

    // Booking must be pending
    if ($booking["status"] !== "Pending") {
        $pdo->rollBack();

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "This booking cannot be paid."
        ]);

        exit;
    }

    // Prevent duplicate payment records
    $checkPayment = $pdo->prepare("
        SELECT id
        FROM payments
        WHERE booking_id = ?
        AND payment_status IN ('Pending', 'Completed')
        LIMIT 1
    ");

    $checkPayment->execute([$bookingId]);

    if ($checkPayment->fetch()) {
        $pdo->rollBack();

        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" => "A payment record already exists for this booking."
        ]);

        exit;
    }

    // Set payment status according to payment method
    if ($paymentMethod === "Card") {

        // Simulated card payment
        $paymentStatus = "Completed";
        $bookingStatus = "Confirmed";
        $message = "Test payment completed successfully.";

    } else {

        // Cash payment at cinema
        $paymentStatus = "Pending";
        $bookingStatus = "Pending";
        $message = "Cash payment recorded. Please pay at the cinema counter.";

    }

    // Generate transaction reference
    $prefix = ($paymentMethod === "Card") ? "PAY-" : "CASH-";

    $transactionReference = $prefix .
        strtoupper(bin2hex(random_bytes(5)));

    $amount = (float) $booking["total_amount"];

    // Insert payment record
    $paymentSQL = "
        INSERT INTO payments (
            booking_id,
            payment_method,
            transaction_reference,
            amount,
            payment_status
        )
        VALUES (?, ?, ?, ?, ?)
    ";

    $paymentStmt = $pdo->prepare($paymentSQL);

    $paymentStmt->execute([
        $bookingId,
        $paymentMethod,
        $transactionReference,
        $amount,
        $paymentStatus
    ]);

    $paymentId = $pdo->lastInsertId();

    // Update booking only when Card payment is completed
    if ($paymentMethod === "Card") {

        $updateBooking = $pdo->prepare("
            UPDATE bookings
            SET status = 'Confirmed'
            WHERE id = ?
            AND user_id = ?
        ");

        $updateBooking->execute([
            $bookingId,
            $userId
        ]);

    }

    // Commit database transaction
    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => $message,

        "payment" => [
            "payment_id" => $paymentId,
            "booking_id" => $bookingId,
            "booking_reference" => $booking["booking_reference"],
            "transaction_reference" => $transactionReference,
            "payment_method" => $paymentMethod,
            "amount" => $amount,
            "payment_status" => $paymentStatus,
            "booking_status" => $bookingStatus
        ]
    ]);

} catch (PDOException $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Payment processing error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to process payment."
    ]);

} catch (Throwable $e) {

    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Payment error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "An unexpected error occurred."
    ]);

}

?>