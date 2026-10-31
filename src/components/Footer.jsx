import {FaFilm,FaFacebook,FaTwitter,FaInstagram,FaYoutube,FaGift,FaLock} from "react-icons/fa";
import "./Footer.css";

function Footer() {
return ( <footer className="footer">


  <div className="footer-container">

    {/* COLUMN 1 - BRAND */}
    <div className="footer-brand">

      <h2>
        <FaFilm className="footer-logo-icon" />
        CINE<span>VERSE</span>
      </h2>

      <p>
        Experience cinema like never before. High-definition
        laser projection, immersive Dolby Atmos soundscapes,
        and frictionless online ticket booking.
      </p>

      <div className="social-icons">
        <a href="#"><FaFacebook /></a>
        <a href="#"><FaTwitter /></a>
        <a href="#"><FaInstagram /></a>
        <a href="#"><FaYoutube /></a>
      </div>

    </div>


    {/* COLUMN 2 - QUICK LINKS */}
    <div className="footer-links">

      <h3>Quick Links</h3>

      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/movies">Now Showing</a></li>
        <li><a href="/movies">Coming Soon</a></li>
        <li><a href="/tickets">My Bookings</a></li>
      </ul>

    </div>


    {/* COLUMN 3 - CINEMA HALLS */}
    <div className="footer-halls">

      <h3>Cinema Halls</h3>

      <ul>
        <li>IMAX Laser 4K</li>
        <li>Dolby Atmos Surround</li>
        <li>VIP Recliner Lounge</li>
        <li>4DX Motion</li>
      </ul>

    </div>


    {/* COLUMN 4 - CINEMA EXPERIENCE */}
    <div className="footer-experience">

      <h3>Cinema Experience</h3>

      <div className="promo-box">

        <h4>
          <FaGift />
          Special Promo Code
        </h4>

        <p>
          Use code <span className="promo-code">CINEMA20</span>
          {" "}at checkout for 20% off all tickets!
        </p>

      </div>

      <a href="/admin" className="admin-link">
        <FaLock />
        Admin Portal
      </a>

    </div>

  </div>


  {/* COPYRIGHT */}
  <div className="footer-bottom">

    <p>
      © 2026 CINEVERSE Online Cinema Booking System.
      All rights reserved.
    </p>

  </div>

</footer>


);
}

export default Footer;
