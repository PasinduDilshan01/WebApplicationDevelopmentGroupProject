import { useState } from "react";

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
  FaSync
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
import "./AdminDashboard.css";


function AdminDashboard() {

  const [activeMenu, setActiveMenu] = useState("Dashboard Overview");

  const menuItems = [
    { name: "Dashboard Overview", icon: <FaChartPie /> },
    { name: "Movie Management", icon: <FaFilm /> },
    { name: "Showtimes & Halls", icon: <FaCalendarAlt /> },
    { name: "Booking Ledger", icon: <FaTicketAlt /> },
    { name: "Customer Accounts", icon: <FaUsers /> },
    { name: "Sales Reports", icon: <FaFileInvoiceDollar /> }
  ];

  const revenueData = [
    { day: "Oct 24", revenue: 0 },
    { day: "Oct 25", revenue: 0 },
    { day: "Oct 26", revenue: 0 },
    { day: "Oct 27", revenue: 0 },
    { day: "Oct 28", revenue: 0 },
    { day: "Oct 29", revenue: 0 },
    { day: "Oct 30", revenue: 0 }
  ];

  const genreData = [
    { name: "Action", value: 25, color: "#ed0015" },
    { name: "Crime", value: 5, color: "#8855ee" },
    { name: "Thriller", value: 25, color: "#10b981" },
    { name: "Adventure", value: 5, color: "#f59e0b" },
    { name: "Sci-Fi", value: 25, color: "#3b82f6" },
    { name: "Drama", value: 10, color: "#ec4899" },
    { name: "Romance", value: 5, color: "#e50914" }
  ];

  const bookings = [
    {
      customer: "Alex Morgan",
      movie: "Avengers: Endgame",
      seats: "A1, A2",
      amount: "$25.00",
      status: "Confirmed"
    },
    {
      customer: "John Smith",
      movie: "Interstellar",
      seats: "B4, B5",
      amount: "$20.00",
      status: "Confirmed"
    },
    {
      customer: "Sarah Wilson",
      movie: "Inception",
      seats: "C1",
      amount: "$12.50",
      status: "Pending"
    }
  ];

  const stats = [
    {
      title: "Total Revenue (Gross)",
      value: "$183.26",
      icon: <MdAttachMoney />,
      color: "green"
    },
    {
      title: "Total Confirmed Bookings",
      value: "7",
      icon: <FaTicketAlt />,
      color: "purple"
    },
    {
      title: "Registered Customers",
      value: "6",
      icon: <FaUsers />,
      color: "yellow"
    },
    {
      title: "Today's Sales ($0.00)",
      value: "0",
      icon: <MdBolt />,
      color: "red"
    }
  ];

  return (

    <div className="admin-dashboard">

      {/* SIDEBAR */}

      <aside className="admin-sidebar">

        <div className="admin-logo">
          <FaFilm />
          <h2>CINE<span>VERSE</span></h2>
          <small>ADMIN</small>
        </div>

        <div className="sidebar-menu">

          {menuItems.map((item) => (

            <button
              key={item.name}
              className={
                activeMenu === item.name
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
              onClick={() => setActiveMenu(item.name)}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>

          ))}

        </div>

        <button className="customer-site">
          🌐 View Customer Site
        </button>

        <div className="admin-profile">

          <FaUserCircle />

          <div>
            <h4>Cinema Admin</h4>
            <p>admin@cinema.com</p>
          </div>

          <FaSignOutAlt className="logout-icon" />

        </div>

      </aside>


      {/* MAIN CONTENT */}

      <main className="admin-main">

        {/* HEADER */}

        <header className="admin-header">

          <h1>{activeMenu === "Dashboard Overview"
            ? "System Overview & Analytics"
            : activeMenu}
          </h1>

          <div className="header-actions">

            <span className="database-status">
              ● Database Online
            </span>

            <button className="refresh-button">
              <FaSync />
              Refresh
            </button>

          </div>

        </header>


        {/* DASHBOARD CONTENT */}

        <section className="dashboard-content">
             {activeMenu === "Sales Reports" ? (
                <SalesReports />
                ) :activeMenu === "Customer Accounts" ? (
                <CustomerAccounts />
                ) :activeMenu === "Booking Ledger" ? (
                <BookingLedger />
                ) :activeMenu === "Showtimes & Halls" ? (
                <ShowtimesManagement />
                ) : activeMenu === "Movie Management" ? (
                <MovieManagement />
                 ) : (
                   <>
          {/* STATISTICS */}

          <div className="stats-grid">

            {stats.map((item) => (

              <div className="stat-card" key={item.title}>

                <div>
                  <h2>{item.value}</h2>
                  <p>{item.title}</p>
                </div>

                <div className={`stat-icon ${item.color}`}>
                  {item.icon}
                </div>

              </div>

            ))}

          </div>


          {/* CHARTS */}

          <div className="charts-grid">

            {/* REVENUE CHART */}

            <div className="chart-card revenue-card">

              <div className="card-heading">
                <h2>
                  <MdLeaderboard />
                  7-Day Revenue Trend
                </h2>

                <span>Daily ticket sales in USD</span>
              </div>

              <div className="line-chart">

                <ResponsiveContainer width="100%" height="100%">

                  <LineChart data={revenueData}>

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

                <ResponsiveContainer width="100%" height="100%">

                  <PieChart>

                    <Pie
                      data={genreData}
                      dataKey="value"
                      innerRadius="48%"
                      outerRadius="85%"
                      paddingAngle={0}
                    >

                      {genreData.map((item, index) => (

                        <Cell
                          key={index}
                          fill={item.color}
                        />

                      ))}

                    </Pie>

                    <Tooltip />

                  </PieChart>

                </ResponsiveContainer>

              </div>

              <div className="genre-legend">

                {genreData.map((genre) => (

                  <span key={genre.name}>
                    <i style={{
                      background: genre.color
                    }}></i>

                    {genre.name}
                  </span>

                ))}

              </div>

            </div>

          </div>


          {/* BOTTOM SECTION */}

          <div className="bottom-grid">

            {/* RECENT BOOKINGS */}

            <div className="chart-card bookings-card">

              <div className="card-heading">

                <h2>
                  🔴 Recent Bookings
                </h2>

                <button>
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

                    {bookings.map((booking, index) => (

                      <tr key={index}>

                        <td>{booking.customer}</td>
                        <td>{booking.movie}</td>
                        <td>{booking.seats}</td>
                        <td>{booking.amount}</td>

                        <td>
                          <span className={
                            booking.status === "Confirmed"
                              ? "confirmed"
                              : "pending"
                          }>
                            {booking.status}
                          </span>
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>


            {/* TOP MOVIES */}

            <div className="chart-card movies-card">

              <h2>🏆 Top Movies by Gross</h2>

              <div className="movie-item">
                <div className="movie-number">1</div>
                <div>
                  <h4>Avengers: Endgame</h4>
                  <p>$85.00 Gross Revenue</p>
                </div>
              </div>

              <div className="movie-item">
                <div className="movie-number">2</div>
                <div>
                  <h4>Interstellar</h4>
                  <p>$60.00 Gross Revenue</p>
                </div>
              </div>

              <div className="movie-item">
                <div className="movie-number">3</div>
                <div>
                  <h4>Inception</h4>
                  <p>$38.26 Gross Revenue</p>
                </div>
              </div>

            </div>

          </div>
          </>
          )}


        </section>

      </main>

    </div>

  );
}

export default AdminDashboard;