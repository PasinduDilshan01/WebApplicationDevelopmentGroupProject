import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import API from "../services/api";

import {
    FaFilm,
    FaChartPie,
    FaCalendarAlt,
    FaTicketAlt,
    FaUsers,
    FaFileInvoiceDollar,
    FaSignOutAlt,
    FaUserCircle,
    FaHome,
    FaSync,
    FaStar,
    FaMoneyBillWave,
    FaQrcode
} from "react-icons/fa";

import {
    MdMovie,
    MdAttachMoney,
    MdBolt,
    MdLeaderboard
} from "react-icons/md";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";

import MovieManagement from "./MovieManagement";
import ShowtimesManagement from "./ShowtimesManagement";
import BookingLedger from "./BookingLedger";
import CustomerAccounts from "./CustomerAccounts";
import SalesReports from "./SalesReports";
import CinemaHallManagement from "./CinemaHallManagement";
import ReviewsManagement from "./ReviewsManagement";
import PaymentsManagement from "./PaymentsManagement";
import QRCodeScanner from "./QRCodeScanner";

import "./AdminDashboard.css";


function AdminDashboard() {

    const navigate = useNavigate();

    // =========================================
    // STATE
    // =========================================

    const [activeMenu, setActiveMenu] = useState(
        "Dashboard Overview"
    );

    const [adminUser, setAdminUser] = useState(null);

    const [dashboardData, setDashboardData] = useState(null);

    const [dashboardLoading, setDashboardLoading] = useState(true);

    const [dashboardError, setDashboardError] = useState("");


    // =========================================
    // FETCH ADMIN PROFILE
    // =========================================

    useEffect(() => {

        const fetchAdminProfile = async () => {

            try {

                const response = await API.get(
                    "/auth/profile.php"
                );

                if (
                    response.data.success &&
                    response.data.user.role === "admin"
                ) {

                    setAdminUser(response.data.user);

                }

            } catch (error) {

                console.error(
                    "Unable to load admin profile:",
                    error
                );

            }

        };

        fetchAdminProfile();

    }, []);


    // =========================================
    // FETCH DASHBOARD DATA FROM MYSQL
    // =========================================

    const fetchDashboardData = useCallback(async () => {

        try {

            setDashboardLoading(true);

            setDashboardError("");

            const response = await API.get(
                "/admin/dashboard.php"
            );

            if (response.data.success) {

                setDashboardData(response.data);

            } else {

                setDashboardError(
                    response.data.message ||
                    "Unable to load dashboard information."
                );

            }

        } catch (error) {

            console.error(
                "Dashboard database error:",
                error
            );

            setDashboardError(
                error.response?.data?.message ||
                "Unable to connect to dashboard database."
            );

        } finally {

            setDashboardLoading(false);

        }

    }, []);


    // LOAD DATA WHEN DASHBOARD OPENS

    useEffect(() => {

        fetchDashboardData();

    }, [fetchDashboardData]);


    // =========================================
    // ADMIN LOGOUT
    // =========================================

    const handleAdminLogout = async () => {

        try {

            await API.post("/auth/logout.php");

            setAdminUser(null);

            navigate("/");

            window.location.reload();

        } catch (error) {

            console.error(
                "Admin logout failed:",
                error
            );

            alert("Unable to logout. Please try again.");

        }

    };


    // =========================================
    // SIDEBAR MENU ITEMS
    // =========================================

    const menuItems = [

        {
            name: "Dashboard Overview",
            icon: <FaChartPie />
        },

        {
            name: "Movie Management",
            icon: <FaFilm />
        },

        {
            name: "Cinema Hall Management",
            icon: <FaHome />
        },

        {
            name: "Showtimes & Halls",
            icon: <FaCalendarAlt />
        },

        {
            name: "Booking Ledger",
            icon: <FaTicketAlt />
        },

        {
            name: "Customer Accounts",
            icon: <FaUsers />
        },

        {
            name: "Reviews Management",
            icon: <FaStar />
        },

        {
            name: "Payments Management",
            icon: <FaMoneyBillWave />
        },

        {
            name: "QR Ticket Scanner",
            icon: <FaQrcode />
        },

        {
            name: "Sales Reports",
            icon: <FaFileInvoiceDollar />
        }

    ];


    // =========================================
    // DATABASE DATA
    // =========================================

    const revenueData =
        dashboardData?.revenue_data || [];

    const genreData =
        dashboardData?.genre_data || [];

    const bookings =
        dashboardData?.recent_bookings || [];

    const topMovies =
        dashboardData?.top_movies || [];


    // =========================================
    // CURRENCY FORMAT
    // =========================================

    const formatCurrency = (amount) => {

        return `Rs. ${Number(amount || 0).toFixed(2)}`;

    };


    // =========================================
    // DASHBOARD STATISTICS
    // =========================================

    const stats = [

        {
            title: "Total Revenue (Gross)",

            value: formatCurrency(
                dashboardData?.stats?.total_revenue
            ),

            icon: <MdAttachMoney />,

            color: "green"
        },

        {
            title: "Total Confirmed Bookings",

            value:
                dashboardData?.stats?.confirmed_bookings ?? 0,

            icon: <FaTicketAlt />,

            color: "purple"
        },

        {
            title: "Registered Customers",

            value:
                dashboardData?.stats?.registered_customers ?? 0,

            icon: <FaUsers />,

            color: "yellow"
        },

        {
            title: "Today's Sales",

            value: formatCurrency(
                dashboardData?.stats?.today_sales
            ),

            icon: <MdBolt />,

            color: "red"
        }

    ];


    // =========================================
    // RETURN DASHBOARD
    // =========================================

    return (

        <div className="admin-dashboard">


            {/* =================================
                SIDEBAR
            ================================= */}

            <aside className="admin-sidebar">


                {/* LOGO */}

                <div className="admin-logo">

                    <FaFilm />

                    <h2>
                        CINE<span>VERSE</span>
                    </h2>

                    <small>ADMIN</small>

                </div>


                {/* SIDEBAR MENU */}

                <div className="sidebar-menu">

                    {menuItems.map((item) => (

                        <button

                            key={item.name}

                            className={
                                activeMenu === item.name
                                    ? "sidebar-item active"
                                    : "sidebar-item"
                            }

                            onClick={() =>
                                setActiveMenu(item.name)
                            }

                        >

                            {item.icon}

                            <span>{item.name}</span>

                        </button>

                    ))}

                </div>


                {/* CUSTOMER SITE BUTTON */}

                <button

                    className="customer-site"

                    onClick={() => navigate("/")}

                >

                    🌐 View Customer Site

                </button>


                {/* ADMIN PROFILE */}

                <div className="admin-profile">

                    <FaUserCircle />

                    <div>

                        <h4>
                            {adminUser?.name || "Loading..."}
                        </h4>

                        <p>
                            {adminUser?.email || ""}
                        </p>

                    </div>

                    <FaSignOutAlt

                        className="logout-icon"

                        title="Sign Out"

                        onClick={handleAdminLogout}

                        style={{ cursor: "pointer" }}

                    />

                </div>


            </aside>


            {/* =================================
                MAIN CONTENT
            ================================= */}

            <main className="admin-main">


                {/* HEADER */}

                <header className="admin-header">


                    <h1>

                        {activeMenu === "Dashboard Overview"
                            ? "System Overview & Analytics"
                            : activeMenu}

                    </h1>


                    <div className="header-actions">


                        <span className="database-status">

                            ● Database Online

                        </span>


                        <button

                            className="refresh-button"

                            onClick={fetchDashboardData}

                            disabled={dashboardLoading}

                        >

                            <FaSync />

                            {dashboardLoading
                                ? "Loading..."
                                : "Refresh"}

                        </button>


                    </div>


                </header>


                {/* =================================
                    DASHBOARD CONTENT
                ================================= */}

                <section className="dashboard-content">


                    {/* SALES REPORTS */}

                    {activeMenu === "Sales Reports" ? (

                        <SalesReports />


                    ) : activeMenu === "QR Ticket Scanner" ? (

                        <QRCodeScanner />


                    ) : activeMenu === "Reviews Management" ? (

                        <ReviewsManagement />


                    ) : activeMenu === "Payments Management" ? (

                        <PaymentsManagement />


                    ) : activeMenu === "Customer Accounts" ? (

                        <CustomerAccounts />


                    ) : activeMenu === "Booking Ledger" ? (

                        <BookingLedger />


                    ) : activeMenu === "Showtimes & Halls" ? (

                        <ShowtimesManagement />


                    ) : activeMenu === "Movie Management" ? (

                        <MovieManagement />


                    ) : activeMenu === "Cinema Hall Management" ? (

                        <CinemaHallManagement />


                    ) : (


                        /* =================================
                           DASHBOARD OVERVIEW
                        ================================= */

                        <>

                            {dashboardLoading ? (

                                <div className="dashboard-loading">

                                    <FaSync />

                                    <p>
                                        Loading dashboard information...
                                    </p>

                                </div>

                            ) : dashboardError ? (

                                <div className="dashboard-error">

                                    <p>
                                        {dashboardError}
                                    </p>

                                    <button
                                        onClick={fetchDashboardData}
                                    >
                                        Try Again
                                    </button>

                                </div>

                            ) : (

                                <>


                                    {/* =================================
                                        STATISTICS CARDS
                                    ================================= */}

                                    <div className="stats-grid">

                                        {stats.map((item) => (

                                            <div

                                                className="stat-card"

                                                key={item.title}

                                            >

                                                <div>

                                                    <h2>
                                                        {item.value}
                                                    </h2>

                                                    <p>
                                                        {item.title}
                                                    </p>

                                                </div>


                                                <div
                                                    className={`stat-icon ${item.color}`}
                                                >

                                                    {item.icon}

                                                </div>

                                            </div>

                                        ))}

                                    </div>


                                    {/* =================================
                                        CHARTS
                                    ================================= */}

                                    <div className="charts-grid">


                                        {/* REVENUE CHART */}

                                        <div className="chart-card revenue-card">


                                            <div className="card-heading">

                                                <h2>

                                                    <MdLeaderboard />

                                                    7-Day Revenue Trend

                                                </h2>


                                                <span>
                                                    Daily ticket sales in LKR
                                                </span>

                                            </div>


                                            <div className="line-chart">

                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >

                                                    <LineChart
                                                        data={revenueData}
                                                    >

                                                        <CartesianGrid

                                                            stroke="#252c3b"

                                                            strokeDasharray="3 3"

                                                        />


                                                        <XAxis

                                                            dataKey="day"

                                                            stroke="#9299a8"

                                                        />


                                                        <YAxis

                                                            stroke="#9299a8"

                                                        />


                                                        <Tooltip

                                                            formatter={(value) =>
                                                                formatCurrency(value)
                                                            }

                                                            contentStyle={{

                                                                background: "#171e30",

                                                                border: "1px solid #30394d",

                                                                color: "white"

                                                            }}

                                                        />


                                                        <Line

                                                            type="monotone"

                                                            dataKey="revenue"

                                                            stroke="#9555ff"

                                                            strokeWidth={3}

                                                            dot={{

                                                                fill: "#9555ff",

                                                                stroke: "#b18aff",

                                                                strokeWidth: 3,

                                                                r: 6

                                                            }}

                                                        />


                                                    </LineChart>

                                                </ResponsiveContainer>

                                            </div>


                                        </div>


                                        {/* GENRE CHART */}

                                        <div className="chart-card genre-card">


                                            <h2>
                                                🟡 Popular Genres
                                            </h2>


                                            <div className="genre-chart">

                                                {genreData.length > 0 ? (

                                                    <ResponsiveContainer
                                                        width="100%"
                                                        height="100%"
                                                    >

                                                        <PieChart>

                                                            <Pie

                                                                data={genreData}

                                                                dataKey="value"

                                                                nameKey="name"

                                                                innerRadius="48%"

                                                                outerRadius="85%"

                                                                paddingAngle={0}

                                                            >

                                                                {genreData.map(
                                                                    (item, index) => (

                                                                        <Cell

                                                                            key={index}

                                                                            fill={item.color}

                                                                        />

                                                                    )
                                                                )}

                                                            </Pie>


                                                            <Tooltip />

                                                        </PieChart>

                                                    </ResponsiveContainer>

                                                ) : (

                                                    <p>
                                                        No genre sales data available.
                                                    </p>

                                                )}

                                            </div>


                                            <div className="genre-legend">

                                                {genreData.map((genre) => (

                                                    <span key={genre.name}>

                                                        <i

                                                            style={{
                                                                background: genre.color
                                                            }}

                                                        ></i>

                                                        {genre.name}

                                                    </span>

                                                ))}

                                            </div>


                                        </div>


                                    </div>


                                    {/* =================================
                                        BOTTOM SECTION
                                    ================================= */}

                                    <div className="bottom-grid">


                                        {/* RECENT BOOKINGS */}

                                        <div className="chart-card bookings-card">


                                            <div className="card-heading">


                                                <h2>
                                                    🔴 Recent Bookings
                                                </h2>


                                                <button
                                                    onClick={() =>
                                                        setActiveMenu("Booking Ledger")
                                                    }
                                                >
                                                    View All Ledger →
                                                </button>


                                            </div>


                                            <div className="table-container">


                                                <table>


                                                    <thead>

                                                        <tr>

                                                            <th>Customer</th>

                                                            <th>Movie</th>

                                                            <th>Seats</th>

                                                            <th>Amount</th>

                                                            <th>Status</th>

                                                        </tr>

                                                    </thead>


                                                    <tbody>


                                                        {bookings.length > 0 ? (

                                                            bookings.map(
                                                                (booking) => (

                                                                    <tr key={booking.id}>

                                                                        <td>
                                                                            {booking.customer}
                                                                        </td>

                                                                        <td>
                                                                            {booking.movie}
                                                                        </td>

                                                                        <td>
                                                                            {booking.seats || "-"}
                                                                        </td>

                                                                        <td>
                                                                            {formatCurrency(
                                                                                booking.amount
                                                                            )}
                                                                        </td>


                                                                        <td>

                                                                            <span

                                                                                className={
                                                                                    booking.status === "Confirmed"
                                                                                        ? "confirmed"
                                                                                        : booking.status === "Pending"
                                                                                            ? "pending"
                                                                                            : "cancelled"
                                                                                }

                                                                            >

                                                                                {booking.status}

                                                                            </span>

                                                                        </td>


                                                                    </tr>

                                                                )
                                                            )

                                                        ) : (

                                                            <tr>

                                                                <td colSpan="5">
                                                                    No bookings found.
                                                                </td>

                                                            </tr>

                                                        )}


                                                    </tbody>


                                                </table>


                                            </div>


                                        </div>


                                        {/* TOP MOVIES */}

                                        <div className="chart-card movies-card">


                                            <h2>
                                                🏆 Top Movies by Gross
                                            </h2>


                                            {topMovies.length > 0 ? (

                                                topMovies.map(
                                                    (movie, index) => (

                                                        <div

                                                            className="movie-item"

                                                            key={movie.movie_id}

                                                        >

                                                            <div className="movie-number">

                                                                {index + 1}

                                                            </div>


                                                            <div>

                                                                <h4>
                                                                    {movie.title}
                                                                </h4>

                                                                <p>

                                                                    {formatCurrency(
                                                                        movie.gross_revenue
                                                                    )}

                                                                    {" "}Gross Revenue

                                                                </p>

                                                            </div>


                                                        </div>

                                                    )
                                                )

                                            ) : (

                                                <p>
                                                    No movie sales available yet.
                                                </p>

                                            )}


                                        </div>


                                    </div>


                                </>

                            )}

                        </>

                    )}


                </section>


            </main>


        </div>

    );

}


export default AdminDashboard;