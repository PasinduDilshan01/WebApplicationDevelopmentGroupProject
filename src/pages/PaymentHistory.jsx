import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../services/api";

import "./PaymentHistory.css";


function PaymentHistory() {

    const navigate = useNavigate();

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // FETCH CUSTOMER PAYMENT HISTORY
    useEffect(() => {
        fetchPayments();
    }, []);


    const fetchPayments = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await API.get(
                "/payments/my_payments.php"
            );

            if (response.data.success) {

                setPayments(response.data.payments || []);

            } else {

                setError(
                    response.data.message ||
                    "Unable to load payment history."
                );

            }

        } catch (err) {

            if (err.response?.status === 401) {

                setError(
                    "Please log in to view your payment history."
                );

            } else {

                setError(
                    err.response?.data?.message ||
                    "Something went wrong while loading payments."
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


    // LOADING SCREEN
    if (loading) {

        return (

            <div className="payment-history-container">

                <p className="payment-history-loading">
                    Loading payment history...
                </p>

            </div>

        );

    }


    return (

        <div className="payment-history-container">


            {/* PAGE HEADER */}

            <div className="payment-history-header">

                <h1>My Payments</h1>

                <p>
                    View your cinema payment transactions.
                </p>

            </div>


            {/* ERROR MESSAGE */}

            {error && (

                <div className="payment-history-error">

                    {error}

                    {error.toLowerCase().includes("log in") && (

                        <button onClick={() => navigate("/login")}>
                            Log In
                        </button>

                    )}

                </div>

            )}


            {/* EMPTY PAYMENT HISTORY */}

            {!error && payments.length === 0 && (

                <div className="no-payments">

                    <h2>No Payments Yet</h2>

                    <p>
                        You haven't made any cinema payments yet.
                    </p>

                    <button onClick={() => navigate("/movies")}>
                        Browse Movies
                    </button>

                </div>

            )}


            {/* PAYMENT LIST */}

            <div className="payment-history-list">

                {payments.map((payment) => (

                    <div
                        className="payment-history-card"
                        key={payment.payment_id}
                    >


                        {/* PAYMENT HEADER */}

                        <div className="payment-history-card-header">

                            <div>

                                <h2>
                                    {payment.movie_title}
                                </h2>

                                <span>
                                    Booking: {payment.booking_reference}
                                </span>

                            </div>


                            <span
                                className={`payment-history-status ${String(
                                    payment.payment_status
                                ).toLowerCase()}`}
                            >
                                {payment.payment_status}
                            </span>

                        </div>


                        {/* PAYMENT DETAILS */}

                        <div className="payment-history-details">


                            <div className="payment-history-detail">

                                <span>Transaction Reference</span>

                                <strong>
                                    {payment.transaction_reference}
                                </strong>

                            </div>


                            <div className="payment-history-detail">

                                <span>Payment Method</span>

                                <strong>
                                    {payment.payment_method}
                                </strong>

                            </div>


                            <div className="payment-history-detail">

                                <span>Payment Date</span>

                                <strong>
                                    {formatDate(payment.payment_date)}
                                </strong>

                            </div>


                            <div className="payment-history-detail">

                                <span>Show Date</span>

                                <strong>
                                    {formatDate(payment.show_date)}
                                </strong>

                            </div>


                            <div className="payment-history-detail">

                                <span>Show Time</span>

                                <strong>
                                    {formatTime(payment.show_time)}
                                </strong>

                            </div>


                            <div className="payment-history-detail">

                                <span>Cinema Hall</span>

                                <strong>
                                    {payment.hall_name}
                                </strong>

                            </div>


                            <div className="payment-history-detail total-payment">

                                <span>Payment Amount</span>

                                <strong>
                                    Rs. {Number(
                                        payment.amount
                                    ).toFixed(2)}
                                </strong>

                            </div>


                        </div>


                    </div>

                ))}

            </div>


        </div>

    );

}


export default PaymentHistory;