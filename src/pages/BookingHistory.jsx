import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../services/api";

import "./BookingHistory.css";


function BookingHistory() {

    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState(null);


    // FETCH CUSTOMER BOOKINGS
    useEffect(() => {
        fetchBookings();
    }, []);


    const fetchBookings = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await API.get(
                "/bookings/my_bookings.php"
            );

            if (response.data.success) {

                setBookings(response.data.bookings || []);

            } else {

                setError(
                    response.data.message ||
                    "Unable to load booking history."
                );

            }

        } catch (err) {

            if (err.response?.status === 401) {

                setError(
                    "Please log in to view your booking history."
                );

            } else {

                setError(
                    err.response?.data?.message ||
                    "Something went wrong while loading your bookings."
                );

            }

        } finally {

            setLoading(false);

        }

    };


    // FORMAT DATE
    const formatDate = (date) => {

        if (!date) {
            return "Not available";
        }

        return new Date(date).toLocaleDateString();

    };


    // FORMAT TIME
    const formatTime = (time) => {

        if (!time) {
            return "Not available";
        }

        return new Date(
            `2000-01-01T${time}`
        ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    };


    // CANCEL BOOKING
    const handleCancelBooking = async (booking) => {

        const confirmed = window.confirm(
            `Are you sure you want to cancel booking ${booking.booking_reference}?`
        );

        if (!confirmed) {
            return;
        }

        try {

            setCancellingId(booking.booking_id);
            setError("");

            const response = await API.post(
                "/bookings/cancel.php",
                {
                    booking_id: booking.booking_id
                }
            );

            if (response.data.success) {

                alert("Booking cancelled successfully!");

                // Refresh booking history
                await fetchBookings();

            } else {

                setError(
                    response.data.message ||
                    "Unable to cancel booking."
                );

            }

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Something went wrong while cancelling your booking."
            );

        } finally {

            setCancellingId(null);

        }

    };


    // LOADING SCREEN
    if (loading) {

        return (

            <div className="booking-history-container">

                <p className="booking-loading">
                    Loading your bookings...
                </p>

            </div>

        );

    }


    return (

        <div className="booking-history-container">


            {/* PAGE HEADER */}

            <div className="booking-history-header">

                <h1>My Bookings</h1>

                <p>
                    View your cinema booking history and ticket details.
                </p>

            </div>


            {/* ERROR MESSAGE */}

            {error && (

                <div className="booking-history-error">

                    {error}

                    {error.toLowerCase().includes("log in") && (

                        <button onClick={() => navigate("/login")}>
                            Log In
                        </button>

                    )}

                </div>

            )}


            {/* EMPTY BOOKINGS */}

            {!error && bookings.length === 0 && (

                <div className="no-bookings">

                    <h2>No Bookings Yet</h2>

                    <p>
                        You haven't booked any movie tickets yet.
                    </p>

                    <button onClick={() => navigate("/movies")}>
                        Browse Movies
                    </button>

                </div>

            )}


            {/* BOOKING LIST */}

            <div className="booking-history-list">

                {bookings.map((booking) => (

                    <div
                        className="booking-history-card"
                        key={booking.booking_id}
                    >


                        {/* BOOKING HEADER */}

                        <div className="booking-card-header">

                            <div>

                                <h2>
                                    {booking.movie_title}
                                </h2>

                                <span className="booking-reference">
                                    Reference: {booking.booking_reference}
                                </span>

                            </div>


                            <span
                                className={`booking-status ${String(
                                    booking.booking_status
                                ).toLowerCase()}`}
                            >
                                {booking.booking_status}
                            </span>

                        </div>


                        {/* BOOKING DETAILS */}

                        <div className="booking-card-details">


                            <div className="booking-detail">

                                <span>Booking Date</span>

                                <strong>
                                    {formatDate(booking.booking_date)}
                                </strong>

                            </div>


                            <div className="booking-detail">

                                <span>Show Date</span>

                                <strong>
                                    {formatDate(booking.show_date)}
                                </strong>

                            </div>


                            <div className="booking-detail">

                                <span>Show Time</span>

                                <strong>
                                    {formatTime(booking.show_time)}
                                </strong>

                            </div>


                            <div className="booking-detail">

                                <span>Cinema Hall</span>

                                <strong>
                                    {booking.hall_name}
                                </strong>

                            </div>


                            <div className="booking-detail">

                                <span>Seats</span>

                                <strong>
                                    {booking.seats || "Not available"}
                                </strong>

                            </div>


                            <div className="booking-detail">

                                <span>Total Amount</span>

                                <strong>
                                    Rs. {Number(
                                        booking.total_amount
                                    ).toFixed(2)}
                                </strong>

                            </div>


                            <div className="booking-detail">

                                <span>Payment Method</span>

                                <strong>
                                    {booking.payment_method || "Not paid"}
                                </strong>

                            </div>


                            <div className="booking-detail">

                                <span>Payment Status</span>

                                <strong
                                    className={`payment-status ${String(
                                        booking.payment_status || "unpaid"
                                    ).toLowerCase()}`}
                                >
                                    {booking.payment_status || "Not paid"}
                                </strong>

                            </div>


                        </div>


                        {/* CANCEL BOOKING BUTTON */}

                        {booking.booking_status === "Pending" && (

                            <div className="booking-card-actions">

                                <button
                                    className="cancel-booking-button"

                                    onClick={() => handleCancelBooking(booking)}

                                    disabled={
                                        cancellingId === booking.booking_id
                                    }
                                >

                                    {cancellingId === booking.booking_id
                                        ? "Cancelling..."
                                        : "Cancel Booking"}

                                </button>

                            </div>

                        )}


                    </div>

                ))}

            </div>


        </div>

    );

}


export default BookingHistory;