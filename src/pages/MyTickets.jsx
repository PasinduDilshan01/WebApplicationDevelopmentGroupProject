import { useEffect, useState } from "react";

import {
    FaClock,
    FaHistory,
    FaPlus,
    FaTicketAlt,
    FaPrint,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaStar
} from "react-icons/fa";

import { Link } from "react-router-dom";

import QRCode from "qrcode";

import API from "../services/api";

import "./MyTickets.css";


function MyTickets({ setAuthMode }) {

    const [activeTab, setActiveTab] = useState("upcoming");

    const [bookings, setBookings] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [isLoggedIn, setIsLoggedIn] = useState(true);


    // FETCH CUSTOMER BOOKINGS
    const fetchBookings = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await API.get(
                "/bookings/my_bookings.php"
            );

            if (response.data.success) {

                setBookings(response.data.bookings || []);

                setIsLoggedIn(true);

            } else {

                setError(
                    response.data.message ||
                    "Unable to load bookings."
                );

            }

        } catch (err) {

            if (err.response?.status === 401) {

                setIsLoggedIn(false);

            } else {

                setError(
                    err.response?.data?.message ||
                    "Unable to retrieve your bookings."
                );

            }

        } finally {

            setLoading(false);

        }

    };


    // LOAD BOOKINGS
    useEffect(() => {

        fetchBookings();

    }, []);


    // CHECK WHETHER SHOWTIME HAS PASSED
    const isPastBooking = (booking) => {

        const showDateTime = new Date(
            `${booking.show_date}T${booking.show_time}`
        );

        return showDateTime < new Date();

    };


    // FILTER BOOKINGS
    const upcomingBookings = bookings.filter(
        booking =>
            booking.booking_status !== "Cancelled" &&
            !isPastBooking(booking)
    );

    const pastBookings = bookings.filter(
        booking =>
            booking.booking_status === "Cancelled" ||
            isPastBooking(booking)
    );


    const displayedBookings =
        activeTab === "upcoming"
            ? upcomingBookings
            : pastBookings;


    // FORMAT DATE
    const formatDate = (date) => {

        if (!date) return "Not available";

        return new Date(
            date + "T00:00:00"
        ).toLocaleDateString("en-US", {

            year: "numeric",
            month: "long",
            day: "numeric"

        });

    };


    // FORMAT TIME
    const formatTime = (time) => {

        if (!time) return "Not available";

        const [hours, minutes] = time.split(":");

        const date = new Date();

        date.setHours(
            Number(hours),
            Number(minutes),
            0
        );

        return date.toLocaleTimeString("en-US", {

            hour: "numeric",
            minute: "2-digit"

        });

    };


    // ESCAPE HTML
    const escapeHTML = (value) => {

        return String(value ?? "").replace(
            /[&<>"']/g,
            (character) => ({

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            })[character]
        );

    };


    // PRINT PROFESSIONAL ONE-PAGE CINEMA TICKET
    const handlePrintTicket = async (booking) => {

        // Check QR token
        if (!booking.ticket_code) {

            alert(
                "QR ticket code is unavailable. Please contact the administrator."
            );

            return;

        }


       // Allow confirmed bookings and cash bookings with pending payment.
const isCashPending =
    booking.payment_method?.toLowerCase() === "cash" &&
    booking.payment_status?.toLowerCase() === "pending" &&
    booking.booking_status === "Pending";

if (booking.booking_status !== "Confirmed" && !isCashPending) {
    alert(
        "This booking is not eligible for ticket printing."
    );
    return;
}


        // Prevent printing an already used ticket
        if (booking.ticket_status === "Used") {

            alert(
                "This ticket has already been used."
            );

            return;

        }


        // Open print window
        const printWindow = window.open(
            "",
            "_blank",
            "width=1000,height=700"
        );


        if (!printWindow) {

            alert(
                "Please allow pop-ups in your browser to print your ticket."
            );

            return;

        }


        try {

            // Generate ONE QR code for the entire booking
            const qrCodeImage = await QRCode.toDataURL(
                booking.ticket_code,
                {

                    width: 300,
                    margin: 2,
                    errorCorrectionLevel: "H"

                }
            );


            // Retrieve booking seats
            const seats = booking.seats
                ? booking.seats.split(",").map(
                    seat => seat.trim()
                )
                : [];


            // Booking details
            const movieTitle = escapeHTML(
                booking.movie_title
            );

            const bookingReference = escapeHTML(
                booking.booking_reference
            );

            const customerName = escapeHTML(
                booking.customer_name || "CINEVERSE Customer"
            );

            const hallName = escapeHTML(
                booking.hall_name
            );

            const showDate = escapeHTML(
                formatDate(booking.show_date)
            );

            const showTime = escapeHTML(
                formatTime(booking.show_time)
            );

            const paymentMethod = escapeHTML(
                booking.payment_method || "Not available"
            );

            const paymentStatus = escapeHTML(
                booking.payment_status || "Pending"
            );

            const totalAmount = Number(
                booking.total_amount
            ).toFixed(2);


            // Generate seat labels
            const seatHTML = seats.map(seat => `

                <span class="seat">
                    ${escapeHTML(seat)}
                </span>

            `).join("");


            // Create printable ticket
            printWindow.document.write(`

                <!DOCTYPE html>

                <html>

                <head>

                    <title>CINEVERSE Cinema Ticket</title>

                    <meta charset="UTF-8">

                    <style>

                        @page {

                            size: A5 landscape;
                            margin: 8mm;

                        }


                        * {

                            box-sizing: border-box;

                        }


                        body {

                            margin: 0;
                            padding: 0;
                            font-family: Arial, sans-serif;
                            background: white;
                            color: #111827;

                        }


                        /* MAIN TICKET */

                        .ticket {

                            width: 100%;
                            height: 125mm;

                            display: flex;

                            border: 2px solid #d4a900;
                            border-radius: 12px;

                            overflow: hidden;

                            background: white;

                        }


                        /* LEFT SECTION */

                        .ticket-left {

                            width: 70%;

                            padding: 22px;

                            position: relative;

                        }


                        .brand {

                            font-size: 25px;

                            font-weight: 900;

                            letter-spacing: 4px;

                            color: #d4a900;

                        }


                        .brand-subtitle {

                            font-size: 10px;

                            letter-spacing: 3px;

                            color: #64748b;

                            margin-top: 4px;

                        }


                        .movie-title {

                            font-size: 26px;

                            font-weight: 800;

                            margin: 22px 0 8px;

                            color: #111827;

                        }


                        .ticket-type {

                            display: inline-block;

                            padding: 5px 12px;

                            background: #fef3c7;

                            color: #92400e;

                            border-radius: 4px;

                            font-size: 10px;

                            font-weight: bold;

                            letter-spacing: 1px;

                        }


                        .customer-name {

                            margin-top: 13px;

                            font-size: 12px;

                            color: #475569;

                        }


                        /* DETAILS */

                        .details-grid {

                            display: grid;

                            grid-template-columns: 1fr 1fr;

                            gap: 17px 12px;

                            margin-top: 24px;

                        }


                        .detail-label {

                            font-size: 9px;

                            text-transform: uppercase;

                            color: #64748b;

                            letter-spacing: 1px;

                            margin-bottom: 5px;

                        }


                        .detail-value {

                            font-size: 13px;

                            font-weight: bold;

                            color: #111827;

                        }


                        /* SEATS */

                        .seat-section {

                            margin-top: 22px;

                        }


                        .seat-list {

                            display: flex;

                            flex-wrap: wrap;

                            gap: 7px;

                            margin-top: 8px;

                        }


                        .seat {

                            background: #111827;

                            color: #facc15;

                            padding: 7px 12px;

                            border-radius: 4px;

                            font-size: 12px;

                            font-weight: bold;

                        }


                        /* BOTTOM INFORMATION */

                        .ticket-bottom {

                            position: absolute;

                            bottom: 15px;

                            left: 22px;

                            right: 22px;

                            border-top: 1px dashed #cbd5e1;

                            padding-top: 10px;

                            display: flex;

                            justify-content: space-between;

                            align-items: center;

                        }


                        .booking-reference {

                            font-size: 10px;

                            color: #64748b;

                        }


                        .total {

                            font-size: 17px;

                            font-weight: bold;

                            color: #b8860b;

                        }


                        /* RIGHT SECTION */

                        .ticket-right {

                            width: 30%;

                            background: #111827;

                            color: white;

                            padding: 18px 12px;

                            display: flex;

                            flex-direction: column;

                            align-items: center;

                            justify-content: center;

                            text-align: center;

                            border-left: 2px dashed #d4a900;

                        }


                        .qr-title {

                            color: #facc15;

                            font-size: 13px;

                            font-weight: bold;

                            margin-bottom: 12px;

                            letter-spacing: 1px;

                        }


                        .qr-image {

                            width: 145px;

                            height: 145px;

                            background: white;

                            padding: 7px;

                            border-radius: 7px;

                        }


                        .qr-description {

                            font-size: 9px;

                            line-height: 1.5;

                            color: #cbd5e1;

                            margin-top: 12px;

                        }


                        .qr-reference {

                            font-size: 10px;

                            color: #facc15;

                            font-weight: bold;

                            margin-top: 12px;

                            overflow-wrap: anywhere;

                        }


                        .payment-status {

                            margin-top: 12px;

                            font-size: 10px;

                            color: #86efac;

                            font-weight: bold;

                        }


                        /* SCREEN PREVIEW */

                        @media screen {

                            body {

                                padding: 20px;

                                background: #e2e8f0;

                            }


                            .ticket {

                                max-width: 850px;

                                margin: 20px auto;

                                height: 472px;

                                box-shadow: 0 8px 25px rgba(0,0,0,0.15);

                            }


                            .print-button {

                                display: block;

                                margin: 20px auto;

                                padding: 12px 35px;

                                background: #111827;

                                color: white;

                                border: none;

                                border-radius: 6px;

                                font-weight: bold;

                                cursor: pointer;

                            }

                        }


                        /* PRINT SETTINGS */

                        @media print {

                            body {

                                padding: 0;

                                background: white;

                            }


                            .ticket {

                                width: 100%;

                                height: 125mm;

                                box-shadow: none;

                            }


                            .print-button {

                                display: none !important;

                            }

                        }

                    </style>

                </head>


                <body>


                    <div class="ticket">


                        <!-- LEFT SECTION -->

                        <div class="ticket-left">


                            <div class="brand">

                                CINEVERSE

                            </div>


                            <div class="brand-subtitle">

                                CINEMA EXPERIENCE

                            </div>


                            <h1 class="movie-title">

                                ${movieTitle}

                            </h1>


                            <span class="ticket-type">
                                ${isCashPending
                                ? "PAYMENT PENDING - PAY AT CINEMA"
                                : "OFFICIAL TICKET"}
                              </span>


                            <div class="customer-name">

                                CUSTOMER: ${customerName}

                            </div>


                            <div class="details-grid">


                                <div>

                                    <div class="detail-label">

                                        Cinema Hall

                                    </div>

                                    <div class="detail-value">

                                        ${hallName}

                                    </div>

                                </div>


                                <div>

                                    <div class="detail-label">

                                        Show Date

                                    </div>

                                    <div class="detail-value">

                                        ${showDate}

                                    </div>

                                </div>


                                <div>

                                    <div class="detail-label">

                                        Showtime

                                    </div>

                                    <div class="detail-value">

                                        ${showTime}

                                    </div>

                                </div>


                                <div>

                                    <div class="detail-label">

                                        Number of Seats

                                    </div>

                                    <div class="detail-value">

                                        ${seats.length}

                                    </div>

                                </div>


                            </div>


                            <div class="seat-section">


                                <div class="detail-label">

                                    RESERVED SEATS

                                </div>


                                <div class="seat-list">

                                    ${seatHTML}

                                </div>


                            </div>


                            <div class="ticket-bottom">


                                <div class="booking-reference">

                                    BOOKING REF:

                                    <strong>

                                        ${bookingReference}

                                    </strong>

                                    <br>

                                    PAYMENT:

                                    ${paymentMethod} - ${paymentStatus}

                                </div>


                                <div class="total">

                                    Rs. ${totalAmount}

                                </div>


                            </div>


                        </div>



                        <!-- RIGHT SECTION -->

                        <div class="ticket-right">


                            <div class="qr-title">

                                SCAN TO VERIFY

                            </div>


                            <img

                                class="qr-image"

                                src="${qrCodeImage}"

                                alt="Booking QR Code"

                            />


                           <div class="qr-description">
    ${
        isCashPending
            ? "Present this QR code at the cinema payment counter. Complete payment before entering the cinema."
            : "Present this QR code at the cinema entrance for ticket verification."
    }
    <br><br>
    This QR code covers the entire booking.
</div>


                            <div class="qr-reference">

                                ${bookingReference}

                            </div>


                           <div
    class="payment-status"
    style="color: ${isCashPending ? '#fbbf24' : '#86efac'};"
>
    ${isCashPending
        ? "PAYMENT DUE AT CINEMA"
        : `PAYMENT ${paymentStatus.toUpperCase()}`}
</div>


                        </div>


                    </div>


                    <button

                        class="print-button"

                        onclick="window.print()"

                    >

                        PRINT CINEMA TICKET

                    </button>


                </body>

                </html>

            `);


            printWindow.document.close();


            // Wait for ticket content and QR image to load
            printWindow.onload = () => {

                printWindow.focus();

                printWindow.print();

            };


        } catch (error) {

            console.error(
                "Ticket printing error:",
                error
            );

            printWindow.close();

            alert(
                "Unable to generate the ticket. Please try again."
            );

        }

    };


    // LOADING SCREEN
    if (loading) {

        return (

            <div className="tickets-page">

                <div className="tickets-content">

                    Loading your bookings...

                </div>

            </div>

        );

    }


    // LOGIN SCREEN
    if (!isLoggedIn) {

        return (

            <div className="tickets-page">

                <div className="tickets-content">

                    <div className="ticket-lock">

                        <FaTicketAlt />

                    </div>


                    <h2>

                        Sign In to View Tickets

                    </h2>


                    <p>

                        Please log in to manage your bookings
                        and access your printable tickets.

                    </p>


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

                </div>

            </div>

        );

    }


    // MAIN PAGE
    return (

        <div className="tickets-page">


            {/* PAGE HEADER */}

            <div className="tickets-header">


                <div>

                    <div className="tickets-breadcrumb">

                        <Link to="/">

                            Home

                        </Link>

                        <span>/</span>

                        <span>

                            My Bookings

                        </span>

                    </div>


                    <h1>

                        My Tickets & Bookings

                    </h1>

                </div>


                <Link

                    to="/movies"

                    className="book-new-btn"

                >

                    <FaPlus />

                    Book New Tickets

                </Link>


            </div>



            {/* TABS */}

            <div className="tickets-tabs">


                <button

                    className={
                        activeTab === "upcoming"
                            ? "active"
                            : ""
                    }

                    onClick={() => setActiveTab("upcoming")}

                >

                    <FaClock />

                    Upcoming Movies ({upcomingBookings.length})

                </button>



                <button

                    className={
                        activeTab === "past"
                            ? "active"
                            : ""
                    }

                    onClick={() => setActiveTab("past")}

                >

                    <FaHistory />

                    Past & Cancelled ({pastBookings.length})

                </button>


            </div>



            {/* ERROR MESSAGE */}

            {error && (

                <div className="tickets-error">

                    {error}

                </div>

            )}



            {/* BOOKINGS */}

            <div className="tickets-bookings-list">


                {displayedBookings.length === 0 ? (


                    <div className="tickets-content">


                        <div className="ticket-lock">

                            <FaTicketAlt />

                        </div>


                        <h2>

                            {activeTab === "upcoming"
                                ? "No Upcoming Bookings"
                                : "No Past Bookings"}

                        </h2>


                        <p>

                            {activeTab === "upcoming"
                                ? "You haven't booked any upcoming movies yet."
                                : "Your past and cancelled bookings will appear here."}

                        </p>


                        {activeTab === "upcoming" && (

                            <Link

                                to="/movies"

                                className="book-new-btn"

                            >

                                <FaPlus />

                                Book Tickets

                            </Link>

                        )}


                    </div>


                ) : (


                    displayedBookings.map((booking) => (


                        <div

                            className="customer-ticket-card"

                            key={booking.booking_id}

                        >


                            {/* MOVIE POSTER */}

                            <div className="customer-ticket-poster">


                                <img

                                    src={
                                        booking.poster ||
                                        "https://placehold.co/300x450?text=Movie"
                                    }

                                    alt={booking.movie_title}

                                />


                            </div>



                            {/* BOOKING INFORMATION */}

                            <div className="customer-ticket-info">


                                <h2>

                                    {booking.movie_title}

                                </h2>


                                <p className="ticket-booking-reference">

                                    Reference: {booking.booking_reference}

                                </p>



                                <div className="customer-ticket-detail">

                                    <FaCalendarAlt />

                                    <span>

                                        {formatDate(booking.show_date)}

                                    </span>

                                </div>



                                <div className="customer-ticket-detail">

                                    <FaClock />

                                    <span>

                                        {formatTime(booking.show_time)}

                                    </span>

                                </div>



                                <div className="customer-ticket-detail">

                                    <FaMapMarkerAlt />

                                    <span>

                                        {booking.hall_name}

                                    </span>

                                </div>



                                <div className="customer-ticket-detail">

                                    <FaTicketAlt />

                                    <span>

                                        Seats: {booking.seats || "Not available"}

                                    </span>

                                </div>



                                <div className="customer-ticket-detail">

                                    <FaStar />

                                    <span>

                                        Payment: {booking.payment_status || "Pending"}

                                    </span>

                                </div>



                                <div className="ticket-total">

                                    Total: Rs. {Number(

                                        booking.total_amount

                                    ).toFixed(2)}

                                </div>



                                <div className="ticket-status">

                                    Booking Status:


                                    <strong

                                        className={

                                            booking.booking_status === "Confirmed"

                                                ? "ticket-confirmed"

                                                : booking.booking_status === "Cancelled"

                                                    ? "ticket-cancelled"

                                                    : "ticket-pending"

                                        }

                                    >

                                        {booking.booking_status}

                                    </strong>

                                </div>



                                {/* TICKET STATUS */}

                                {booking.ticket_status === "Used" && (

                                    <p className="ticket-used-message">

                                        This ticket has already been used.

                                    </p>

                                )}



                                {/* PRINT BUTTON */}

                                {(
    booking.booking_status === "Confirmed" ||
    (
        booking.booking_status === "Pending" &&
        booking.payment_method?.toLowerCase() === "cash" &&
        booking.payment_status?.toLowerCase() === "pending"
    )
) &&
    booking.ticket_status !== "Used" && (
        <button
            className="print-ticket-button"
            onClick={() => handlePrintTicket(booking)}
        >
            <FaPrint />
            Print Ticket
        </button>
    )}


                            </div>


                        </div>


                    ))

                )}


            </div>


        </div>

    );

}


export default MyTickets;