import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    FaStar,
    FaArrowRight,
    FaTicketAlt,
    FaFilm,
    FaCheckCircle,
    FaCreditCard,
    FaMoneyBillWave
} from "react-icons/fa";

import API from "../services/api";

import "./Home.css";


function Home() {

    const [movies, setMovies] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [stats, setStats] = useState({
        totalBookings: 0,
        confirmedBookings: 0,
        totalPayments: 0,
        totalSpent: 0
    });

    const [statsLoading, setStatsLoading] = useState(true);


    // FETCH MOVIES
    useEffect(() => {

        const fetchMovies = async () => {

            try {

                const response = await API.get("/movies/list.php");

                if (response.data.success) {

                    const nowShowing = response.data.movies
                        .filter(movie => movie.status === "Now Showing")
                        .slice(0, 8);

                    setMovies(nowShowing);

                } else {

                    setError("Unable to load movies.");

                }

            } catch (err) {

                console.error("Home movie loading error:", err);

                setError("Unable to connect to the movie database.");

            } finally {

                setLoading(false);

            }

        };

        fetchMovies();

    }, []);


    // FETCH CUSTOMER DASHBOARD INFORMATION
    useEffect(() => {

        const fetchDashboardStats = async () => {

            try {

                setStatsLoading(true);

                // Check whether customer is logged in
                const profileResponse = await API.get(
                    "/auth/profile.php"
                );

                if (!profileResponse.data.success) {

                    setIsLoggedIn(false);

                    return;

                }

                setIsLoggedIn(true);


                // Fetch bookings and payments
                const [bookingResponse, paymentResponse] =
                    await Promise.all([
                        API.get("/bookings/my_bookings.php"),
                        API.get("/payments/my_payments.php")
                    ]);


                const bookings = bookingResponse.data.success
                    ? bookingResponse.data.bookings || []
                    : [];

                const payments = paymentResponse.data.success
                    ? paymentResponse.data.payments || []
                    : [];


                // Calculate completed payment amount
                const completedPayments = payments.filter(
                    payment => payment.payment_status === "Completed"
                );

                const totalSpent = completedPayments.reduce(
                    (total, payment) => {
                        return total + Number(payment.amount || 0);
                    },
                    0
                );


                // Update dashboard statistics
                setStats({

                    totalBookings: bookings.length,

                    confirmedBookings: bookings.filter(
                        booking => booking.booking_status === "Confirmed"
                    ).length,

                    totalPayments: payments.length,

                    totalSpent: totalSpent

                });

            } catch (err) {

                console.error(
                    "Customer dashboard loading error:",
                    err
                );

                setIsLoggedIn(false);

            } finally {

                setStatsLoading(false);

            }

        };

        fetchDashboardStats();

    }, []);


    return (

        <div className="home-page">


            {/* HERO SECTION */}

            <section className="home-hero">

                <div className="home-hero-content">

                    <span className="hero-label">
                        WELCOME TO CINEVERSE
                    </span>

                    <h1>
                        Experience Movies
                        <br />
                        Like Never Before
                    </h1>

                    <p>
                        Discover the latest movies and book your
                        favorite cinema seats with CINEVERSE.
                    </p>

                    <Link to="/movies" className="hero-button">

                        Explore Movies

                        <FaArrowRight />

                    </Link>

                </div>

            </section>


            {/* CUSTOMER DASHBOARD */}

            {isLoggedIn && (

                <section className="customer-dashboard">

                    <div className="customer-dashboard-heading">

                        <span className="section-label">
                            YOUR ACCOUNT
                        </span>

                        <h2>My Dashboard</h2>

                        <p>
                            Overview of your cinema bookings and payments.
                        </p>

                    </div>


                    <div className="customer-stats-grid">


                        {/* TOTAL BOOKINGS */}

                        <Link
                            to="/booking-history"
                            className="customer-stat-card"
                        >

                            <div className="customer-stat-icon">
                                <FaFilm />
                            </div>

                            <div className="customer-stat-info">

                                <span>Total Bookings</span>

                                <h3>
                                    {statsLoading
                                        ? "..."
                                        : stats.totalBookings}
                                </h3>

                            </div>

                        </Link>


                        {/* CONFIRMED BOOKINGS */}

                        <Link
                            to="/booking-history"
                            className="customer-stat-card"
                        >

                            <div className="customer-stat-icon">
                                <FaCheckCircle />
                            </div>

                            <div className="customer-stat-info">

                                <span>Confirmed Bookings</span>

                                <h3>
                                    {statsLoading
                                        ? "..."
                                        : stats.confirmedBookings}
                                </h3>

                            </div>

                        </Link>


                        {/* TOTAL PAYMENTS */}

                        <Link
                            to="/payment-history"
                            className="customer-stat-card"
                        >

                            <div className="customer-stat-icon">
                                <FaCreditCard />
                            </div>

                            <div className="customer-stat-info">

                                <span>Total Payments</span>

                                <h3>
                                    {statsLoading
                                        ? "..."
                                        : stats.totalPayments}
                                </h3>

                            </div>

                        </Link>


                        {/* TOTAL SPENT */}

                        <Link
                            to="/payment-history"
                            className="customer-stat-card"
                        >

                            <div className="customer-stat-icon">
                                <FaMoneyBillWave />
                            </div>

                            <div className="customer-stat-info">

                                <span>Total Spent</span>

                                <h3>
                                    {statsLoading
                                        ? "..."
                                        : `Rs. ${stats.totalSpent.toFixed(2)}`}
                                </h3>

                            </div>

                        </Link>


                    </div>

                </section>

            )}


            {/* NOW SHOWING SECTION */}

            <section className="home-movies-section">

                <div className="home-section-heading">

                    <div>

                        <span className="section-label">
                            NOW IN CINEMAS
                        </span>

                        <h2>Now Showing</h2>

                    </div>

                    <Link to="/movies" className="view-all-btn">

                        View All

                        <FaArrowRight />

                    </Link>

                </div>


                {loading ? (

                    <p className="home-message">
                        Loading movies...
                    </p>

                ) : error ? (

                    <p className="home-message">
                        {error}
                    </p>

                ) : movies.length === 0 ? (

                    <p className="home-message">
                        No movies are currently showing.
                    </p>

                ) : (

                    <div className="home-movie-grid">

                        {movies.map(movie => (

                            <div
                                className="home-movie-card"
                                key={movie.id}
                            >

                                <Link to={`/movies/${movie.id}`}>

                                    <div className="home-movie-poster">

                                        <img
                                            src={
                                                movie.poster ||
                                                "https://placehold.co/600x850/111827/ffffff?text=Movie+Poster"
                                            }
                                            alt={movie.title}
                                            onError={(e) => {

                                                e.currentTarget.src =
                                                    "https://placehold.co/600x850/111827/ffffff?text=Movie+Poster";

                                            }}
                                        />

                                        <span className="home-movie-rating">

    <FaStar />

    {Number(movie.customer_rating) > 0
        ? Number(movie.customer_rating).toFixed(1)
        : "No Ratings"}

</span>

                                    </div>

                                </Link>


                                <div className="home-movie-details">

                                    <h3>{movie.title}</h3>
                                    <p className="home-movie-reviews">

    {Number(movie.total_reviews)}{" "}

    {Number(movie.total_reviews) === 1
        ? "Customer Review"
        : "Customer Reviews"}

</p>

                                    <p>
                                        {movie.duration} minutes
                                        {" • "}
                                        {movie.certificate}
                                    </p>

                                    <Link
                                        to={`/movies/${movie.id}`}
                                        className="home-book-button"
                                    >

                                        <FaTicketAlt />

                                        Book Tickets

                                    </Link>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </section>

        </div>

    );

}


export default Home;