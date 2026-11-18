import { useEffect, useState } from "react";

import {
    FaCalendarCheck,
    FaTrophy,
    FaCouch,
    FaFileCsv,
    FaPrint,
    FaFilm,
    FaClock,
    FaMoneyBillWave,
    FaTicketAlt
} from "react-icons/fa";

import API from "../services/api";

import "./SalesReports.css";


function formatCurrency(value) {
    return `Rs. ${Number(value || 0).toFixed(2)}`;
}


function formatDate(date) {
    if (!date) return "-";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function formatTime(time) {
    if (!time) return "";

    return time.slice(0, 5);
}


function downloadCSV(data) {

    const rows = [
        [
            "Date",
            "Bookings Completed",
            "Tickets Sold",
            "Gross Revenue",
            "Average Ticket Value"
        ],

        ...data.map((row) => [
            row.report_date,
            row.total_bookings,
            row.total_tickets,
            Number(row.gross_revenue).toFixed(2),

            row.total_tickets > 0
                ? (
                    Number(row.gross_revenue) /
                    Number(row.total_tickets)
                ).toFixed(2)
                : "0.00"
        ])
    ];

    const csv = rows
        .map((row) =>
            row
                .map((value) =>
                    `"${String(value).replaceAll('"', '""')}"`
                )
                .join(",")
        )
        .join("\n");


    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "cineverse-sales-report.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


function SalesReports() {

    const [report, setReport] = useState({
        movies: [],
        showtimes: [],
        daily_sales: [],
        top_movies: [],
        hall_occupancy: [],
        totals: {
            revenue: 0,
            bookings: 0,
            tickets: 0
        }
    });


    const [movieId, setMovieId] = useState("");

    const [showtimeId, setShowtimeId] = useState("");

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // =====================================
    // LOAD SALES REPORT FROM DATABASE
    // =====================================

    useEffect(() => {

        let cancelled = false;


        const loadSalesReport = async () => {

            try {

                setLoading(true);

                setError("");


                const response = await API.get(
                    "/reports/sales.php",
                    {
                        params: {
                            movie_id: movieId,
                            showtime_id: showtimeId
                        }
                    }
                );


                if (!response.data.success) {

                    throw new Error(
                        response.data.message ||
                        "Unable to load sales report."
                    );

                }


                if (!cancelled) {

                    setReport(response.data);

                }

            } catch (err) {

                console.error("Sales report error:", err);

                if (!cancelled) {

                    setError(
                        err.response?.data?.message ||
                        err.message ||
                        "Unable to connect to sales report API."
                    );

                }

            } finally {

                if (!cancelled) {
                    setLoading(false);
                }

            }

        };


        loadSalesReport();


        return () => {
            cancelled = true;
        };

    }, [movieId, showtimeId]);


    // =====================================
    // HANDLE MOVIE FILTER
    // =====================================

    const handleMovieChange = (event) => {

        setMovieId(event.target.value);

        // Reset showtime when movie changes
        setShowtimeId("");

    };


    // =====================================
    // HANDLE SHOWTIME FILTER
    // =====================================

    const handleShowtimeChange = (event) => {

        setShowtimeId(event.target.value);

    };


    // =====================================
    // CALCULATE AVERAGE TICKET VALUE
    // =====================================

    const averageTicketValue =
        Number(report.totals.tickets) > 0
            ? Number(report.totals.revenue) /
              Number(report.totals.tickets)
            : 0;


    // =====================================
    // PRINT REPORT
    // =====================================

    const handlePrint = () => {

        window.print();

    };


    return (

        <section className="sales-reports">


            {/* =================================
                REPORT HEADER
            ================================= */}

            <header className="sales-header">

                <h1>
                    Financial &amp; Sales Analytics Reports
                </h1>


                <div className="sales-header-actions">

                    <button
                        onClick={() =>
                            downloadCSV(report.daily_sales)
                        }
                        disabled={loading || report.daily_sales.length === 0}
                    >

                        <FaFileCsv />

                        Export CSV

                    </button>


                    <button
                        className="print-report"
                        onClick={handlePrint}
                        disabled={loading}
                    >

                        <FaPrint />

                        Print Report

                    </button>

                </div>

            </header>


            {/* =================================
                FILTER SECTION
            ================================= */}

            <section className="sales-filter-panel">

                <div className="sales-filter-heading">

                    <h2>
                        <FaFilm />

                        Report Filters

                    </h2>

                    <button
                        className="reset-filter-btn"
                        onClick={() => {
                            setMovieId("");
                            setShowtimeId("");
                        }}
                    >
                        Reset Filters
                    </button>

                </div>


                <div className="sales-filter-grid">


                    {/* MOVIE FILTER */}

                    <div className="sales-filter-group">

                        <label htmlFor="movieFilter">

                            <FaFilm />

                            Select Movie

                        </label>


                        <select
                            id="movieFilter"
                            value={movieId}
                            onChange={handleMovieChange}
                        >

                            <option value="">
                                All Movies
                            </option>


                            {report.movies.map((movie) => (

                                <option
                                    key={movie.id}
                                    value={movie.id}
                                >

                                    {movie.title}

                                </option>

                            ))}

                        </select>

                    </div>


                    {/* SHOWTIME FILTER */}

                    <div className="sales-filter-group">

                        <label htmlFor="showtimeFilter">

                            <FaClock />

                            Select Showtime

                        </label>


                        <select
                            id="showtimeFilter"
                            value={showtimeId}
                            onChange={handleShowtimeChange}
                            disabled={!movieId}
                        >

                            <option value="">

                                {movieId
                                    ? "All Showtimes"
                                    : "Select a movie first"}

                            </option>


                            {report.showtimes.map((showtime) => (

                                <option
                                    key={showtime.id}
                                    value={showtime.id}
                                >

                                    {formatDate(showtime.show_date)}
                                    {" | "}
                                    {formatTime(showtime.show_time)}
                                    {" | "}
                                    {showtime.hall_name}

                                </option>

                            ))}

                        </select>

                    </div>

                </div>


                <p className="filter-description">

                    {movieId
                        ? "Showing reports for the selected movie."
                        : "Showing sales reports for all movies."}

                    {showtimeId
                        ? " Selected showtime report is active."
                        : ""}

                </p>

            </section>


            {/* =================================
                LOADING
            ================================= */}

            {loading && (

                <div className="sales-loading">

                    Loading financial and sales reports...

                </div>

            )}


            {/* =================================
                ERROR
            ================================= */}

            {!loading && error && (

                <div className="sales-error">

                    {error}

                </div>

            )}


            {!loading && !error && (

                <>


                    {/* =================================
                        SUMMARY CARDS
                    ================================= */}

                    <div className="sales-summary-grid">


                        <div className="sales-summary-card">

                            <div className="summary-icon revenue-icon">

                                <FaMoneyBillWave />

                            </div>

                            <div>

                                <span>Total Revenue</span>

                                <h3>
                                    {formatCurrency(report.totals.revenue)}
                                </h3>

                            </div>

                        </div>


                        <div className="sales-summary-card">

                            <div className="summary-icon booking-icon">

                                <FaTicketAlt />

                            </div>

                            <div>

                                <span>Completed Bookings</span>

                                <h3>
                                    {report.totals.bookings}
                                </h3>

                            </div>

                        </div>


                        <div className="sales-summary-card">

                            <div className="summary-icon tickets-icon">

                                <FaCouch />

                            </div>

                            <div>

                                <span>Tickets Sold</span>

                                <h3>
                                    {report.totals.tickets}
                                </h3>

                            </div>

                        </div>


                        <div className="sales-summary-card">

                            <div className="summary-icon average-icon">

                                <FaCalendarCheck />

                            </div>

                            <div>

                                <span>Average Ticket Value</span>

                                <h3>
                                    {formatCurrency(averageTicketValue)}
                                </h3>

                            </div>

                        </div>


                    </div>


                    {/* =================================
                        DAILY SALES SUMMARY
                    ================================= */}

                    <section className="sales-panel daily-sales">

                        <h2>

                            <FaCalendarCheck />

                            Daily Sales Summary (Last 30 Days)

                        </h2>


                        <div className="sales-table-wrap">

                            <table className="sales-table">

                                <thead>

                                    <tr>

                                        <th>Date</th>

                                        <th>Bookings Completed</th>

                                        <th>Total Tickets Sold</th>

                                        <th>Gross Revenue</th>

                                        <th>Avg. Ticket Value</th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {report.daily_sales.length > 0 ? (

                                        report.daily_sales.map((row) => (

                                            <tr key={row.report_date}>

                                                <td>
                                                    {formatDate(row.report_date)}
                                                </td>


                                                <td>

                                                    <span className="sales-count">

                                                        {row.total_bookings}

                                                        {" "}

                                                        {Number(row.total_bookings) === 1
                                                            ? "Booking"
                                                            : "Bookings"}

                                                    </span>

                                                </td>


                                                <td>
                                                    {row.total_tickets} Seats
                                                </td>


                                                <td className="sales-revenue">

                                                    {formatCurrency(row.gross_revenue)}

                                                </td>


                                                <td>

                                                    {formatCurrency(
                                                        Number(row.total_tickets) > 0
                                                            ? Number(row.gross_revenue) /
                                                              Number(row.total_tickets)
                                                            : 0
                                                    )}

                                                    {" / seat"}

                                                </td>

                                            </tr>

                                        ))

                                    ) : (

                                        <tr>

                                            <td
                                                colSpan="5"
                                                className="sales-empty"
                                            >

                                                No completed sales found for this selection.

                                            </td>

                                        </tr>

                                    )}

                                </tbody>


                                <tfoot>

                                    <tr>

                                        <td>Total</td>

                                        <td>
                                            {report.totals.bookings} bookings
                                        </td>

                                        <td>
                                            {report.totals.tickets} tickets
                                        </td>

                                        <td className="sales-revenue">

                                            {formatCurrency(report.totals.revenue)}

                                        </td>

                                        <td>—</td>

                                    </tr>

                                </tfoot>

                            </table>

                        </div>

                    </section>


                    {/* =================================
                        BOTTOM REPORT GRID
                    ================================= */}

                    <div className="sales-bottom-grid">


                        {/* TOP GROSSING MOVIES */}

                        <section className="sales-panel">

                            <h2>

                                <FaTrophy />

                                Top Grossing Movies

                            </h2>


                            <div className="sales-table-wrap">

                                <table className="sales-table">

                                    <thead>

                                        <tr>

                                            <th>Movie</th>

                                            <th>Tickets Sold</th>

                                            <th>Gross Revenue</th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {report.top_movies.length > 0 ? (

                                            report.top_movies.map((movie) => (

                                                <tr key={movie.movie_id}>

                                                    <td>
                                                        {movie.title}
                                                    </td>

                                                    <td>
                                                        {movie.tickets_sold}
                                                    </td>

                                                    <td className="sales-revenue">

                                                        {formatCurrency(movie.gross_revenue)}

                                                    </td>

                                                </tr>

                                            ))

                                        ) : (

                                            <tr>

                                                <td
                                                    colSpan="3"
                                                    className="sales-empty"
                                                >

                                                    No movie sales available.

                                                </td>

                                            </tr>

                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </section>


                        {/* CINEMA HALL OCCUPANCY */}

                        <section className="sales-panel">

                            <h2>

                                <FaCouch />

                                Showtime Occupancy

                            </h2>


                            <div className="occupancy-list">

                                {report.hall_occupancy.length > 0 ? (

                                    report.hall_occupancy.map((hall) => (

                                        <div
                                            className="occupancy-row"
                                            key={hall.showtime_id}
                                        >

                                            <div className="occupancy-label">

                                                <span>

                                                    {hall.movie_title}

                                                    <small>

                                                        {hall.hall_name}
                                                        {" | "}
                                                        {formatDate(hall.show_date)}
                                                        {" | "}
                                                        {formatTime(hall.show_time)}

                                                    </small>

                                                </span>


                                                <strong>

                                                    {Number(hall.occupancy || 0).toFixed(1)}%

                                                </strong>

                                            </div>


                                            <div className="occupancy-track">

                                                <div
                                                    className="occupancy-fill"
                                                    style={{
                                                        width: `${Math.min(
                                                            Number(hall.occupancy || 0),
                                                            100
                                                        )}%`
                                                    }}
                                                />

                                            </div>


                                            <small className="occupancy-seats">

                                                {hall.seats_sold}
                                                {" / "}
                                                {hall.total_seats}
                                                {" seats sold"}

                                            </small>

                                        </div>

                                    ))

                                ) : (

                                    <p className="sales-empty">

                                        No showtime occupancy available.

                                    </p>

                                )}

                            </div>

                        </section>


                    </div>

                </>

            )}

        </section>

    );

}


export default SalesReports;