import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import API from "../services/api";

import "./BookingConfirmation.css";


function BookingConfirmation() {

    const location = useLocation();
    const navigate = useNavigate();

    const bookingData = location.state;

    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState("");


    // CHECK BOOKING INFORMATION
    if (
        !bookingData ||
        !bookingData.showtimeId ||
        !bookingData.seatIds?.length
    ) {

        return (

            <div className="confirmation-container">

                <div className="confirmation-card">

                    <h2>Booking Information Not Found</h2>

                    <p>
                        Please select your seats before continuing.
                    </p>

                    <button onClick={() => navigate("/movies")}>
                        Browse Movies
                    </button>

                </div>

            </div>

        );

    }


    // CREATE BOOKING
    const handleConfirmBooking = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await API.post(
                "/bookings/create.php",
                {
                    showtime_id: bookingData.showtimeId,
                    seat_ids: bookingData.seatIds
                }
            );


            if (response.data.success && response.data.booking) {

                const bookingDetails = response.data.booking;

                // Convert PHP response into the format
                // expected by this React component.
                setBooking({

                    ...bookingDetails,

                    booking_id: bookingDetails.id,

                    seats: Array.isArray(bookingDetails.seats)
                        ? bookingDetails.seats
                        : []

                });

            } else {

                setError(
                    response.data.message ||
                    "Unable to create booking."
                );

            }

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Something went wrong while creating your booking."
            );

        } finally {

            setLoading(false);

        }

    };


    // SUCCESSFUL BOOKING
    if (booking) {

        return (

            <div className="confirmation-container">

                <div className="confirmation-card success-card">

                    <div className="success-icon">
                        ✓
                    </div>


                    <h1>Booking Successful!</h1>

                    <p className="success-message">
                        Your seats have been reserved successfully.
                    </p>


                    {/* BOOKING DETAILS */}

                    <div className="booking-details">


                        <div className="detail-row">

                            <span>Booking Reference</span>

                            <strong>
                                {booking.booking_reference}
                            </strong>

                        </div>


                        <div className="detail-row">

                            <span>Booking ID</span>

                            <strong>
                                {booking.booking_id}
                            </strong>

                        </div>


                        <div className="detail-row">

                            <span>Showtime ID</span>

                            <strong>
                                {booking.showtime_id}
                            </strong>

                        </div>


                        <div className="detail-row">

                            <span>Selected Seats</span>

                            <strong>
                                {booking.seats
                                    .map(seat => seat.seat_number)
                                    .join(", ")}
                            </strong>

                        </div>


                        <div className="detail-row">

                            <span>Number of Tickets</span>

                            <strong>
                                {booking.total_seats}
                            </strong>

                        </div>


                        <div className="detail-row">

                            <span>Price Per Ticket</span>

                            <strong>
                                Rs. {Number(
                                    booking.ticket_price
                                ).toFixed(2)}
                            </strong>

                        </div>


                        <div className="detail-row total-row">

                            <span>Total Amount</span>

                            <strong>
                                Rs. {Number(
                                    booking.total_amount
                                ).toFixed(2)}
                            </strong>

                        </div>


                        <div className="detail-row">

                            <span>Booking Status</span>

                            <strong className="pending-status">
                                {booking.status}
                            </strong>

                        </div>


                    </div>


                    <p className="payment-notice">
                        Your booking is pending. Continue to payment
                        to complete your reservation.
                    </p>


                    {/* PROCEED TO PAYMENT */}

                    <button
                        className="confirmation-button"

                        onClick={() => navigate("/payment", {

                            state: {

                                bookingId: booking.booking_id,

                                bookingReference:
                                    booking.booking_reference,

                                amount: booking.total_amount,

                                seats: booking.seats.map(
                                    seat => seat.seat_number
                                ),

                                totalSeats: booking.total_seats

                            }

                        })}
                    >
                        Proceed to Payment
                    </button>


                    {/* VIEW BOOKINGS */}

                    <button
                        className="back-button"

                        onClick={() => navigate("/booking-history")}
                    >
                        View My Bookings
                    </button>


                </div>

            </div>

        );

    }


    // BOOKING CONFIRMATION SCREEN
    return (

        <div className="confirmation-container">

            <div className="confirmation-card">

                <h1>Confirm Your Booking</h1>

                <p className="confirmation-description">
                    Please review your selected seats before confirming.
                </p>


                <div className="booking-details">


                    <div className="detail-row">

                        <span>Showtime ID</span>

                        <strong>
                            {bookingData.showtimeId}
                        </strong>

                    </div>


                    <div className="detail-row">

                        <span>Selected Seat IDs</span>

                        <strong>
                            {bookingData.seatIds.join(", ")}
                        </strong>

                    </div>


                    <div className="detail-row">

                        <span>Number of Seats</span>

                        <strong>
                            {bookingData.seatIds.length}
                        </strong>

                    </div>


                </div>


                {/* ERROR MESSAGE */}

                {error && (

                    <div className="confirmation-error">
                        {error}
                    </div>

                )}


                {/* CONFIRM BOOKING BUTTON */}

                <button
                    className="confirmation-button"

                    onClick={handleConfirmBooking}

                    disabled={loading}
                >

{loading
                        ? "Creating Booking..."
                        : "Confirm Booking"}

                </button>


                {/* BACK BUTTON */}

                <button
                    className="back-button"

                    onClick={() => navigate(-1)}

                    disabled={loading}
                >
                    Back to Seat Selection
                </button>


            </div>

        </div>

    );

}


export default BookingConfirmation;