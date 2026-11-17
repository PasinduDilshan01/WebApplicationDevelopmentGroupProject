import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Payment.css";

function Payment() {
    const location = useLocation();
    const navigate = useNavigate();

    const paymentData = location.state;

    const [paymentMethod, setPaymentMethod] = useState("Card");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [paymentResult, setPaymentResult] = useState(null);

    // Check whether booking details are available
    if (!paymentData || !paymentData.bookingId) {
        return (
            <div className="payment-page">
                <div className="payment-card">
                    <h2>Payment Details Not Found</h2>

                    <p>
                        Please select a booking before proceeding to payment.
                    </p>

                    <button
                        className="payment-back-button"
                        onClick={() => navigate("/booking-history")}
                    >
                        View My Bookings
                    </button>
                </div>
            </div>
        );
    }

    // Process payment
    const handlePayment = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await API.post("/payments/create.php", {
                booking_id: paymentData.bookingId,
                payment_method: paymentMethod
            });

            if (response.data.success) {
                setPaymentResult(response.data.payment);
            } else {
                setError(
                    response.data.message || "Payment could not be completed."
                );
            }

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to process payment. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    // Payment success screen
    if (paymentResult) {
        return (
            <div className="payment-page">
                <div className="payment-card">
                  <div className="payment-success">

                    {paymentResult.payment_method === "Card" ? (

                <>
                        <h2>Payment Successful!</h2>

                    <p>
                        Your test payment has been completed and your booking is confirmed.
                    </p>
                </>

            ) : (

            <>
            <h2>Booking Reserved!</h2>

            <p>
                Your cash payment has been recorded.
                Please pay at the cinema counter.
            </p>
            </>

            )}

</div>
                    <div className="payment-summary">
                        <h3>Payment Receipt</h3>

                        <div className="payment-row">
                            <span>Booking Reference</span>
                            <strong>
                                {paymentResult.booking_reference}
                            </strong>
                        </div>

                        <div className="payment-row">
                            <span>Transaction Reference</span>
                            <strong>
                                {paymentResult.transaction_reference}
                            </strong>
                        </div>

                        <div className="payment-row">
                            <span>Payment Method</span>
                            <strong>
                                {paymentResult.payment_method}
                            </strong>
                        </div>

                        <div className="payment-row">

    <span>Payment Status</span>

    <strong
        className={
            paymentResult.payment_status === "Completed"
                ? "payment-status-completed"
                : "payment-status-pending"
        }
    >
        {paymentResult.payment_status}
    </strong>

</div>

                        <div className="payment-row">
                            <span>Booking Status</span>
                            <strong>
                                {paymentResult.booking_status}
                            </strong>
                        </div>

                        <div className="payment-row">
                            <span>Amount Paid</span>
                            <strong>
                                Rs. {Number(paymentResult.amount).toFixed(2)}
                            </strong>
                        </div>
                    </div>

                    <button
                        className="pay-button"
                        onClick={() => navigate("/booking-history")}
                    >
                        View My Bookings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-page">
            <div className="payment-card">

                <h2>Complete Your Payment</h2>

                <p className="payment-subtitle">
                    Review your booking details before continuing.
                </p>

                <div className="payment-summary">
                    <h3>Booking Summary</h3>

                    <div className="payment-row">
                        <span>Booking Reference</span>
                        <strong>
                            {paymentData.bookingReference}
                        </strong>
                    </div>

                    <div className="payment-row">
                        <span>Number of Seats</span>
                        <strong>
                            {paymentData.totalSeats}
                        </strong>
                    </div>

                    <div className="payment-row">
                        <span>Selected Seats</span>
                        <strong>
                            {Array.isArray(paymentData.seats)
                                ? paymentData.seats.join(", ")
                                : paymentData.seats}
                        </strong>
                    </div>

                    <div className="payment-row">
                        <span>Total Amount</span>
                        <strong>
                            Rs. {Number(paymentData.amount).toFixed(2)}
                        </strong>
                    </div>
                </div>

                <div className="payment-methods">
                    <h3>Select Payment Method</h3>

                    <button
                        type="button"
                        className={
                            paymentMethod === "Card"
                                ? "payment-method active"
                                : "payment-method"
                        }
                        onClick={() => setPaymentMethod("Card")}
                    >
                        Card Payment (Test)
                    </button>

                    <button
                        type="button"
                        className={
                            paymentMethod === "Cash"
                                ? "payment-method active"
                                : "payment-method"
                        }
                        onClick={() => setPaymentMethod("Cash")}
                    >
                        Cash Payment
                    </button>
                </div>

                <div className="payment-test-notice">
                    This is a simulated payment for project testing.
                    No real card transaction will take place.
                </div>

                {error && (
                    <div className="payment-error">
                        {error}
                    </div>
                )}

                <button
                    className="pay-button"
                    onClick={handlePayment}
                    disabled={loading}
                >
                    {loading
                        ? "Processing..."
                        : "Confirm Payment"}
                </button>

                <button
                    className="payment-back-button"
                    onClick={() => navigate("/booking-history")}
                    disabled={loading}
                >
                    Back to My Bookings
                </button>

            </div>
        </div>
    );
}

export default Payment;