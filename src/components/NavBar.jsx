import { useState, useEffect, useRef } from "react";

import {
    FaFilm,
    FaHome,
    FaTicketAlt,
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

    const dropdownRef = useRef(null);


    // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
    useEffect(() => {

        const handleClickOutside = (event) => {

            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setDropdownOpen(false);
            }

        };


        // CLOSE DROPDOWN WITH ESCAPE KEY
        const handleEscape = (event) => {

            if (event.key === "Escape") {
                setDropdownOpen(false);
            }

        };


        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        document.addEventListener("keydown", handleEscape);


        return () => {

            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);

        };

    }, []);


    // LOGOUT
    const handleUserLogout = () => {

        setDropdownOpen(false);

        handleLogout();

    };


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

                    <div
                        className="profile-container"
                        ref={dropdownRef}
                    >


                        {/* MODERN PROFILE BUTTON */}

                        <button
                            className="modern-profile-button"

                            onClick={() =>
                                setDropdownOpen((previous) => !previous)
                            }

                            aria-expanded={dropdownOpen}

                            aria-haspopup="true"
                        >

                            <span className="profile-avatar">
                                {user?.name?.charAt(0).toUpperCase() || "U"}
                            </span>


                            <span className="profile-button-details">

                                <strong>
                                    {user?.name || "User"}
                                </strong>

                                <small>
                                    My Account
                                </small>

                            </span>


                            <FaChevronDown
                                className={`modern-dropdown-arrow ${
                                    dropdownOpen ? "rotated" : ""
                                }`}
                            />

                        </button>


                        {/* MODERN ACCOUNT DROPDOWN */}

                        {dropdownOpen && (

                            <div className="modern-profile-dropdown">


                                {/* ACCOUNT HEADER */}

                                <div className="modern-profile-header">

                                    <div className="modern-large-avatar">

                                        {user?.name?.charAt(0).toUpperCase() || "U"}

                                    </div>


                                    <div className="modern-profile-details">

                                        <h3>
                                            {user?.name || "User"}
                                        </h3>

                                        <p>
                                            {user?.email || ""}
                                        </p>

                                        <span className="account-badge">
                                            CUSTOMER ACCOUNT
                                        </span>

                                    </div>

                                </div>


                                {/* ACCOUNT MENU */}

                                <div className="modern-dropdown-menu">


                                    {/* MY PROFILE */}

                                    <Link
                                        to="/profile"
                                        className="modern-dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >

                                        <FaUser />

                                        <span>My Profile</span>

                                    </Link>


                                    {/* MY TICKETS */}

                                    <Link
                                        to="/tickets"
                                        className="modern-dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >

                                        <FaTicketAlt />

                                        <span>My Tickets</span>

                                    </Link>


                                    {/* MY BOOKINGS */}

                                    <Link
                                        to="/booking-history"
                                        className="modern-dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >

                                        <FaFilm />

                                        <span>My Bookings</span>

                                    </Link>


                                    {/* MY PAYMENTS */}

                                    <Link
                                        to="/payment-history"
                                        className="modern-dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >

                                        <FaCreditCard />

                                        <span>My Payments</span>

                                    </Link>


                                </div>


                                {/* LOGOUT */}

                                <div className="modern-dropdown-footer">

                                    <button
                                        className="modern-logout-button"
                                        onClick={handleUserLogout}
                                    >

                                        <FaSignOutAlt />

                                        <span>Sign Out</span>

                                    </button>

                                </div>


                            </div>

                        )}

                    </div>

                )}

            </div>


        </nav>

    );

}


export default Navbar;
