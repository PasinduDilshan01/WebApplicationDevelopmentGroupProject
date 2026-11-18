<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed."
    ]);

    exit;
}

// Only logged-in admins can access this API.
if (
    !isset($_SESSION["user_id"]) ||
    !isset($_SESSION["role"]) ||
    $_SESSION["role"] !== "admin"
) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Admin authentication required."
    ]);

    exit;
}

try {

    $database = new Database();
    $pdo = $database->connect();

    // =========================================
    // 1. DASHBOARD STATISTICS
    // =========================================

    $statsStmt = $pdo->query("
        SELECT

            (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE payment_status = 'Completed'
            ) AS total_revenue,

            (
                SELECT COUNT(*)
                FROM bookings
                WHERE status = 'Confirmed'
            ) AS confirmed_bookings,

            (
                SELECT COUNT(*)
                FROM users
                WHERE role = 'user'
            ) AS registered_customers,

            (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE payment_status = 'Completed'
                  AND DATE(created_at) = CURDATE()
            ) AS today_sales
    ");

    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);


    // =========================================
    // 2. LAST 7 DAYS REVENUE
    // =========================================

    $revenueStmt = $pdo->query("
        SELECT
            DATE(created_at) AS report_date,
            COALESCE(SUM(amount), 0) AS revenue

        FROM payments

        WHERE payment_status = 'Completed'
          AND created_at >= CURDATE() - INTERVAL 6 DAY
          AND created_at < CURDATE() + INTERVAL 1 DAY

        GROUP BY DATE(created_at)

        ORDER BY report_date ASC
    ");

    $revenueRows = $revenueStmt->fetchAll(PDO::FETCH_ASSOC);


    // Create seven dates, including dates with zero sales.
    $revenueMap = [];

    foreach ($revenueRows as $row) {
        $revenueMap[$row["report_date"]] =
            (float) $row["revenue"];
    }

    $revenueData = [];

    for ($i = 6; $i >= 0; $i--) {

        $date = date("Y-m-d", strtotime("-$i days"));

        $revenueData[] = [
            "day" => date("M d", strtotime($date)),
            "revenue" => $revenueMap[$date] ?? 0
        ];
    }


    // =========================================
    // 3. POPULAR GENRES
    // =========================================

    $genreStmt = $pdo->query("
        SELECT
            g.name,
            COUNT(DISTINCT b.id) AS value

        FROM genres g

        INNER JOIN movie_genres mg
            ON mg.genre_id = g.id

        INNER JOIN movies m
            ON m.id = mg.movie_id

        INNER JOIN showtimes st
            ON st.movie_id = m.id

        INNER JOIN bookings b
            ON b.showtime_id = st.id

        INNER JOIN payments p
            ON p.booking_id = b.id

        WHERE b.status = 'Confirmed'
          AND p.payment_status = 'Completed'

        GROUP BY g.id, g.name

        ORDER BY value DESC
    ");

    $genreRows = $genreStmt->fetchAll(PDO::FETCH_ASSOC);

    $genreColors = [
        "#ed0015",
        "#8855ee",
        "#10b981",
        "#f59e0b",
        "#3b82f6",
        "#ec4899",
        "#e50914"
    ];

    $genreData = [];

    foreach ($genreRows as $index => $genre) {

        $genreData[] = [
            "name" => $genre["name"],
            "value" => (int) $genre["value"],
            "color" => $genreColors[
                $index % count($genreColors)
            ]
        ];
    }


    // =========================================
    // 4. RECENT BOOKINGS
    // =========================================

    $bookingStmt = $pdo->query("
        SELECT

            b.id,
            u.name AS customer,
            m.title AS movie,

            GROUP_CONCAT(
                DISTINCT s.seat_number
                ORDER BY s.seat_number
                SEPARATOR ', '
            ) AS seats,

            b.total_amount AS amount,
            b.status

        FROM bookings b

        INNER JOIN users u
            ON u.id = b.user_id

        INNER JOIN showtimes st
            ON st.id = b.showtime_id

        INNER JOIN movies m
            ON m.id = st.movie_id

        LEFT JOIN booking_seats bs
            ON bs.booking_id = b.id

        LEFT JOIN seats s
            ON s.id = bs.seat_id

        GROUP BY
            b.id,
            u.name,
            m.title,
            b.total_amount,
            b.status

        ORDER BY b.created_at DESC

        LIMIT 5
    ");

    $bookings = $bookingStmt->fetchAll(PDO::FETCH_ASSOC);


    // =========================================
    // 5. TOP MOVIES BY GROSS REVENUE
    // =========================================

    $topMoviesStmt = $pdo->query("
        SELECT

            m.id AS movie_id,
            m.title,

            COALESCE(SUM(p.amount), 0) AS gross_revenue

        FROM movies m

        INNER JOIN showtimes st
            ON st.movie_id = m.id

        INNER JOIN bookings b
            ON b.showtime_id = st.id

        INNER JOIN payments p
            ON p.booking_id = b.id

        WHERE b.status = 'Confirmed'
          AND p.payment_status = 'Completed'

        GROUP BY m.id, m.title

        ORDER BY gross_revenue DESC

        LIMIT 5
    ");

    $topMovies = $topMoviesStmt->fetchAll(PDO::FETCH_ASSOC);


    // =========================================
    // 6. RETURN DASHBOARD DATA
    // =========================================

    echo json_encode([

        "success" => true,

        "stats" => [
            "total_revenue" =>
                (float) $stats["total_revenue"],

            "confirmed_bookings" =>
                (int) $stats["confirmed_bookings"],

            "registered_customers" =>
                (int) $stats["registered_customers"],

            "today_sales" =>
                (float) $stats["today_sales"]
        ],

        "revenue_data" => $revenueData,

        "genre_data" => $genreData,

        "recent_bookings" => $bookings,

        "top_movies" => $topMovies

    ]);

} catch (PDOException $e) {

    error_log("Admin dashboard database error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to load dashboard information."
    ]);

} catch (Exception $e) {

    error_log("Admin dashboard error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "An unexpected error occurred."
    ]);

}