import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import API from "../services/api";
import "./MobileQRScanner.css";

function MobileQRScanner() {
    const [sessionToken, setSessionToken] = useState("");
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState("");
    const [scannerReady, setScannerReady] = useState(false);

    const scannerRef = useRef(null);
    const processingRef = useRef(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("session_token");

        if (!token) {
            setError("Scanner session token is missing.");
            return;
        }

        setSessionToken(token);
    }, []);

    useEffect(() => {
        if (!sessionToken) return;

        let scanner;
        let mounted = true;

        const startScanner = async () => {
            try {
                scanner = new Html5QrcodeScanner(
                    "mobile-qr-reader",
                    {
                        fps: 10,
                        qrbox: {
                            width: 250,
                            height: 250
                        },
                        rememberLastUsedCamera: true
                    },
                    false
                );

                scannerRef.current = scanner;

                scanner.render(
                    async (decodedText) => {
                        if (processingRef.current) return;

                        processingRef.current = true;

                        try {
                            await scanner.clear();
                        } catch (e) {
                            console.log("Scanner stopped.");
                        }

                        if (!mounted) return;

                        setScannerReady(false);
                        setError("");

                        try {
                            const response = await API.post(
                                "/scanner/verify_mobile_ticket.php",
                                {
                                    session_token: sessionToken,
                                    ticket_code: decodedText
                                }
                            );

                            if (mounted) {
                                setScanResult(response.data);
                            }

                        } catch (err) {
                            if (mounted) {
                                setScanResult({
                                    success: false,
                                    message:
                                        err.response?.data?.message ||
                                        "Unable to verify ticket."
                                });
                            }
                        }
                    },
                    () => {}
                );

                if (mounted) {
                    setScannerReady(true);
                }

            } catch (err) {
                if (mounted) {
                    setError(
                        "Unable to start camera. Please allow camera permission and use HTTPS."
                    );
                }
            }
        };

        startScanner();

        return () => {
            mounted = false;

            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => {});
                scannerRef.current = null;
            }
        };
    }, [sessionToken]);

    const scanAgain = () => {
        setScanResult(null);
        setError("");
        processingRef.current = false;

        window.location.reload();
    };

    return (
        <div className="mobile-scanner-page">

            <div className="mobile-scanner-header">
                <h1>CINEVERSE</h1>
                <p>Mobile Ticket Scanner</p>
            </div>

            <div className="mobile-scanner-card">

                <h2>Scan Customer Ticket</h2>

                <p className="scanner-instruction">
                    Place the customer's ticket QR code inside the camera frame.
                </p>

                {error && (
                    <div className="scanner-error">
                        {error}
                    </div>
                )}

                {!error && (
                    <div id="mobile-qr-reader"></div>
                )}

                {scannerReady && !scanResult && (
                    <p className="scanner-status">
                        Camera ready. Waiting for QR code...
                    </p>
                )}

                {scanResult && (
                    <div
                        className={`mobile-scan-result ${
                            scanResult.success ? "valid" : "invalid"
                        }`}
                    >
                        <h3>
                            {scanResult.success
                                ? "ENTRY APPROVED"
                                : "ENTRY NOT APPROVED"}
                        </h3>

                        <p>{scanResult.message}</p>

                        {scanResult.booking && (
                            <div className="mobile-booking-details">

                                <p>
                                    <strong>Booking:</strong>{" "}
                                    {scanResult.booking.booking_reference}
                                </p>

                                <p>
                                    <strong>Customer:</strong>{" "}
                                    {scanResult.booking.customer_name}
                                </p>

                                <p>
                                    <strong>Movie:</strong>{" "}
                                    {scanResult.booking.movie_title}
                                </p>

                                <p>
                                    <strong>Hall:</strong>{" "}
                                    {scanResult.booking.hall_name}
                                </p>

                                <p>
                                    <strong>Date:</strong>{" "}
                                    {scanResult.booking.show_date}
                                </p>

                                <p>
                                    <strong>Time:</strong>{" "}
                                    {scanResult.booking.show_time}
                                </p>

                                <p>
                                    <strong>Seats:</strong>{" "}
                                    {scanResult.booking.seats}
                                </p>

                                <p>
                                    <strong>Payment:</strong>{" "}
                                    {scanResult.booking.payment_status}
                                </p>

                            </div>
                        )}

                        <button
                            className="scan-again-button"
                            onClick={scanAgain}
                        >
                            Scan Next Ticket
                        </button>
                    </div>
                )}

            </div>

            <p className="mobile-scanner-footer">
                CINEVERSE Cinema Ticket Booking System
            </p>

        </div>
    );
}

export default MobileQRScanner;