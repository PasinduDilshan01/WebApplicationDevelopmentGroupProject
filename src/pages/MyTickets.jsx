import { useState } from "react";

import {
  FaClock,
  FaHistory,
  FaLock,
  FaPlus
} from "react-icons/fa";

import { Link } from "react-router-dom";

import "./MyTickets.css";

function MyTickets({ setAuthMode }) {

  const [activeTab, setActiveTab] = useState("upcoming");

  return (

    <div className="tickets-page">

      {/* PAGE HEADER */}

      <div className="tickets-header">

        <div>

          <div className="tickets-breadcrumb">

            <Link to="/">Home</Link>

            <span>/</span>

            <span>My Bookings</span>

          </div>

          <h1>My Tickets & Bookings</h1>

        </div>


        <Link to="/movies" className="book-new-btn">

          <FaPlus />

          Book New Tickets

        </Link>

      </div>


      {/* TABS */}

      <div className="tickets-tabs">

        <button
          className={activeTab === "upcoming" ? "active" : ""}
          onClick={() => setActiveTab("upcoming")}
        >

          <FaClock />

          Upcoming Movies (0)

        </button>


        <button
          className={activeTab === "past" ? "active" : ""}
          onClick={() => setActiveTab("past")}
        >

          <FaHistory />

          Past & Cancelled (0)

        </button>

      </div>


      {/* TICKET CONTENT */}

      <div className="tickets-content">

        <div className="ticket-lock">

          <FaLock />

        </div>


        <h2>
          Sign In to View Tickets
        </h2>


        <p>
          Please log in to manage your active bookings
          and access digital QR passes.
        </p>


        {/* AUTH BUTTONS */}

        <div className="ticket-auth-buttons">

          <button
            className="ticket-signin-btn"
            onClick={() => setAuthMode("signin")}
          >

            Sign In

          </button>


          <button
            className="ticket-register-btn"
            onClick={() => setAuthMode("signup")}
          >

            Register

          </button>

        </div>


        <button
          className="demo-customer-btn"
          onClick={() => alert("Demo login will be available when authentication is connected.")}
        >

          Sign In as Demo Customer

        </button>

      </div>

    </div>

  );

}

export default MyTickets;