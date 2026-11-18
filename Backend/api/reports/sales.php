<?php

require_once __DIR__ . "/../../config/cors.php";
require_once __DIR__ . "/../../config/database.php";

header("Content-Type: application/json");

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

    // Selected filters
    $movieId = isset($_GET["movie_id"]) && $_GET["movie_id"] !== ""
        ? (int) $_GET["movie_id"]
        : null;

    $showtimeId = isset($_GET["showtime_id"]) && $_GET["showtime_id"] !== ""
        ? (int) $_GET["showtime_id"]
        : null;


    // =====================================
    // 1. GET MOVIES FOR FILTER
    // =====================================

    $movieStmt = $pdo->query("
        SELECT id, title
        FROM movies
        ORDER BY title ASC
    ");

    $movies = $movieStmt->fetchAll(PDO::FETCH_ASSOC);


    // =====================================
    // 2. GET SHOWTIMES FOR FILTER
    // =====================================

    $showtimeSql = "
        SELECT
            st.id,
            st.movie_id,
            m.title AS movie_title,
            st.show_date,
            st.show_time,
            ch.name AS hall_name
        FROM showtimes st
        INNER JOIN movies m ON m.id = st.movie_id
        INNER JOIN cinema_halls ch ON ch.id = st.hall_id
        WHERE 1 = 1
    ";

    $showtimeParams = [];

    if ($movieId !== null) {
        $showtimeSql .= " AND st.movie_id = ?";
        $showtimeParams[] = $movieId;
    }

    $showtimeSql .= "
        ORDER BY st.show_date DESC, st.show_time DESC
    ";

    $showtimeStmt = $pdo->prepare($showtimeSql);
    $showtimeStmt->execute($showtimeParams);

    $showtimes = $showtimeStmt->fetchAll(PDO::FETCH_ASSOC);


    // =====================================
    // 3. COMMON REPORT FILTERS
    // =====================================

    $filterSql = "";
    $filterParams = [];

    if ($movieId !== null) {
        $filterSql .= " AND st.movie_id = ?";
        $filterParams[] = $movieId;
    }

    if ($showtimeId !== null) {
        $filterSql .= " AND st.id = ?";
        $filterParams[] = $showtimeId;
    }


    // Completed payments only
    // Confirmed bookings only

    $baseSql = "
        SELECT
            b.id AS booking_id,
            b.total_amount,
            st.id AS showtime_id,
            st.movie_id,
            st.show_date,
            p.paid_at,
            p.paid_amount,
            COUNT(bs.seat_id) AS ticket_count

        FROM bookings b

        INNER JOIN showtimes st
            ON st.id = b.showtime_id

        INNER JOIN (
            SELECT
                booking_id,
                SUM(amount) AS paid_amount,
                MAX(created_at) AS paid_at
            FROM payments
            WHERE payment_status = 'Completed'
            GROUP BY booking_id
        ) p
            ON p.booking_id = b.id

        LEFT JOIN booking_seats bs
            ON bs.booking_id = b.id

        WHERE b.status = 'Confirmed'
        $filterSql

        GROUP BY
            b.id,
            b.total_amount,
            st.id,
            st.movie_id,
            st.show_date,
            p.paid_at,
            p.paid_amount
    ";


    // =====================================
    // 4. DAILY SALES SUMMARY
    // LAST 30 DAYS
    // =====================================

    $dailySql = "
        SELECT
            DATE(report_data.paid_at) AS report_date,
            COUNT(*) AS total_bookings,
            SUM(report_data.ticket_count) AS total_tickets,
            SUM(report_data.paid_amount) AS gross_revenue

        FROM ($baseSql) AS report_data

        WHERE DATE(report_data.paid_at)
            >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)

        GROUP BY DATE(report_data.paid_at)

        ORDER BY report_date DESC
    ";

    $dailyStmt = $pdo->prepare($dailySql);
    $dailyStmt->execute($filterParams);

    $dailySales = $dailyStmt->fetchAll(PDO::FETCH_ASSOC);


    // =====================================
    // 5. TOP GROSSING MOVIES
    // =====================================

    $topMoviesSql = "
        SELECT
            report_data.movie_id,
            m.title,
            SUM(report_data.ticket_count) AS tickets_sold,
            SUM(report_data.paid_amount) AS gross_revenue

        FROM ($baseSql) AS report_data

        INNER JOIN movies m
            ON m.id = report_data.movie_id

        GROUP BY report_data.movie_id, m.title

        ORDER BY gross_revenue DESC
    ";

    $topMoviesStmt = $pdo->prepare($topMoviesSql);
    $topMoviesStmt->execute($filterParams);

    $topMovies = $topMoviesStmt->fetchAll(PDO::FETCH_ASSOC);


    // =====================================
    // 6. CINEMA HALL OCCUPANCY
    // =====================================

    $occupancySql = "
        SELECT
            st.id AS showtime_id,
            m.title AS movie_title,
            st.show_date,
            st.show_time,
            ch.name AS hall_name,
            ch.total_seats,

            COUNT(DISTINCT bs.seat_id) AS seats_sold,

            ROUND(
                COUNT(DISTINCT bs.seat_id)
                / NULLIF(ch.total_seats, 0) * 100,
                2
            ) AS occupancy

        FROM showtimes st

        INNER JOIN movies m
            ON m.id = st.movie_id

        INNER JOIN cinema_halls ch
            ON ch.id = st.hall_id

        LEFT JOIN bookings b
            ON b.showtime_id = st.id
            AND b.status = 'Confirmed'

        LEFT JOIN payments p
            ON p.booking_id = b.id
            AND p.payment_status = 'Completed'

        LEFT JOIN booking_seats bs
            ON bs.booking_id = b.id

        WHERE 1 = 1
        $filterSql

        GROUP BY
            st.id,
            m.title,
            st.show_date,
            st.show_time,
            ch.name,
            ch.total_seats

        ORDER BY st.show_date DESC, st.show_time DESC
    ";

    $occupancyStmt = $pdo->prepare($occupancySql);
    $occupancyStmt->execute($filterParams);

    $hallOccupancy = $occupancyStmt->fetchAll(PDO::FETCH_ASSOC);


    // =====================================
    // 7. TOTAL SALES
    // =====================================

    $totalRevenue = 0;
    $totalBookings = 0;
    $totalTickets = 0;

    foreach ($dailySales as $row) {

        $totalRevenue += (float) $row["gross_revenue"];

        $totalBookings += (int) $row["total_bookings"];

        $totalTickets += (int) $row["total_tickets"];

    }


    // =====================================
    // 8. RESPONSE
    // =====================================

    echo json_encode([

        "success" => true,

        "filters" => [
            "movie_id" => $movieId,
            "showtime_id" => $showtimeId
        ],

        "movies" => $movies,

        "showtimes" => $showtimes,

        "daily_sales" => $dailySales,

        "top_movies" => $topMovies,

        "hall_occupancy" => $hallOccupancy,

        "totals" => [
            "revenue" => round($totalRevenue, 2),
            "bookings" => $totalBookings,
            "tickets" => $totalTickets
        ]

    ]);

} catch (Throwable $e) {

    error_log("Sales report error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to load sales reports."
    ]);

}

?>