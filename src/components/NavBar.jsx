import { useState } from "react";
import { FaFilm, FaHome, FaTicketAlt,FaUserCircle,FaChevronDown,FaSignOutAlt, } from "react-icons/fa";
import { MdMovie } from "react-icons/md";
import { Link } from "react-router-dom";
import "./Navbar.css";


function Navbar({ setAuthMode,isLoggedIn,user,handleLogout}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  return (
    <nav className="navbar">

      <Link to="/" className="navbar-logo">
        <FaFilm className="logo-icon" />
        <h2>
          CINE<span>VERSE</span>
        </h2>
      </Link>

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

            <button
              className="profile-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}>

              <FaUserCircle className="profile-icon" />

              {user?.name || "User"}

              <FaChevronDown className="dropdown-arrow" />

            </button>


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


                <Link
                  to="/tickets"
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}>

                  <FaTicketAlt />

                  My Tickets

                </Link>


                <button
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
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