import { useState } from "react";

import {
    FaFilm,
    FaHome,
    FaTicketAlt,
    FaUserCircle,
    FaChevronDown,
    FaSignOutAlt,
    FaUser,
    FaCreditCard
} from "react-icons/fa";

import { MdMovie } from "react-icons/md";

import { Link } from "react-router-dom";

import "./Navbar.css";


function Navbar({
    setAuthMode,
    isLoggedIn,
    user,
    handleLogout
}) {

    const [dropdownOpen, setDropdownOpen] = useState(false);


    return (

        <nav className="navbar">


            {/* LOGO */}

            <Link to="/" className="navbar-logo">

                <FaFilm className="logo-icon" />

                <h2>
                    CINE<span>VERSE</span>
                </h2>

            </Link>


            {/* NAVIGATION LINKS */}

            <div className="navbar-links">

                <Link to="/" className="nav-link">

                    <FaHome />

                    Home

                </Link>


                <Link to="/movies" className="nav-link">

                    <MdMovie />

                    Movies

                </Link>


                <Link to="/tickets" className="nav-link">

                    <FaTicketAlt />

                    My Tickets

                </Link>

            </div>


            {/* AUTHENTICATION */}

            <div className="navbar-auth">


                {!isLoggedIn ? (

                    <>

                        <button
                            className="signin-btn"
                            onClick={() => setAuthMode("signin")}
                        >
                            Sign In
                        </button>


                        <button
                            className="signup-btn"
                            onClick={() => setAuthMode("signup")}
                        >
                            Sign Up
                        </button>

                    </>

                ) : (


                    <div className="profile-container">


                        {/* PROFILE BUTTON */}

                        <button
                            className="profile-button"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >

                            <FaUserCircle className="profile-icon" />

                            {user?.name || "User"}

                            <FaChevronDown className="dropdown-arrow" />

                        </button>


                        {/* PROFILE DROPDOWN */}

                        {dropdownOpen && (

                            <div className="profile-dropdown">


                                <div className="profile-info">

                                    <h3>
                                        {user?.name || "User"}
                                    </h3>

                                    <p>
                                        {user?.email}
                                    </p>

                                </div>


                                {/* MY PROFILE */}

                                <Link
                                    to="/profile"
                                    className="dropdown-item"
                                    onClick={() => setDropdownOpen(false)}
                                >

                                    <FaUser />

                                    My Profile

                                </Link>


                                {/* MY TICKETS */}

                                <Link
                                    to="/tickets"
                                    className="dropdown-item"
                                    onClick={() => setDropdownOpen(false)}
                                >

                                    <FaTicketAlt />

                                    My Tickets

                                </Link>


                                {/* MY BOOKINGS */}

                                <Link
                                    to="/booking-history"
                                    className="dropdown-item"
                                    onClick={() => setDropdownOpen(false)}
                                >

                                    <FaFilm />

                                    My Bookings

                                </Link>


                                {/* MY PAYMENTS */}

                                <Link
                                    to="/payment-history"
                                    className="dropdown-item"
                                    onClick={() => setDropdownOpen(false)}
                                >

                                    <FaCreditCard />

                                    My Payments

                                </Link>


                                {/* SIGN OUT */}

                                <button
                                    className="dropdown-item logout-item"

                                    onClick={() => {

                                        setDropdownOpen(false);

                                        handleLogout();

                                    }}
                                >

                                    <FaSignOutAlt />

                                    Sign Out

                                </button>


                            </div>

                        )}

                    </div>

                )}

            </div>


        </nav>

    );

}


export default Navbar;