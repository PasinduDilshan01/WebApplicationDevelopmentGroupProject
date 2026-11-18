import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import API from "../services/api";

function QRCodeScanner() {
    const [sessionId, setSessionId] = useState(null);
    const [sessionToken, setSessionToken] = useState("");
    const [connectionQR, setConnectionQR] = useState("");
    const [sessionStatus, setSessionStatus] = useState("Connecting...");
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const lastUpdatedRef = useRef("");

    // Create a wireless scanner session.
    useEffect(() => {
        let mounted = true;

        const createSession = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await API.post(
                    "/scanner/create_session.php"
                );

                if (!response.data.success) {
                    throw new Error(
                        response.data.message ||
                        "Unable to create scanner session."
                    );
                }

                const session = response.data.session;

                // Generate the phone connection URL.
                const mobileURL =
                    `${window.location.origin}/mobile-scanner` +
                    `?session_token=${encodeURIComponent(
                        session.session_token
                    )}`;

                const qrImage = await QRCode.toDataURL(mobileURL, {
                    width: 300,
                    margin: 2,
                    errorCorrectionLevel: "H"
                });

                if (!mounted) return;

                setSessionId(session.id);
                setSessionToken(session.session_token);
                setConnectionQR(qrImage);
                setSessionStatus("Active");
                setLoading(false);

            } catch (err) {
                if (!mounted) return;

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Unable to connect scanner."
                );

                setSessionStatus("Disconnected");
                setLoading(false);
            }
        };

        createSession();

        return () => {
            mounted = false;
        };
    }, []);

    // Retrieve mobile scanning results every two seconds.
    useEffect(() => {
        if (!sessionId) return;

        const fetchResults = async () => {
            try {
                const response = await API.get(
                    "/scanner/get_scan_result.php",
                    {
                        params: {
                            session_id: sessionId
                        }
                    }
                );

                if (!response.data.success) return;

                setSessionStatus(response.data.session_status);

                const updatedAt = response.data.updated_at;

                if (
                    response.data.last_scan &&
                    updatedAt &&
                    updatedAt !== lastUpdatedRef.current
                ) {
                    lastUpdatedRef.current = updatedAt;
                    setScanResult(response.data.last_scan);
                }

            } catch (err) {
                console.error(
                    "Unable to retrieve scanner result:",
                    err
                );
            }
        };

        fetchResults();

        const interval = setInterval(fetchResults, 2000);

        return () => clearInterval(interval);
    }, [sessionId]);

    return (
        <div className="qr-scanner-page">

            <div className="qr-scanner-card">

                <h2>Wireless QR Ticket Scanner</h2>

                <p>
                    Connect your mobile phone to scan and verify
                    customer tickets wirelessly.
                </p>

                {loading && (
                    <p>Creating scanner connection...</p>
                )}

                {error && (
                    <div className="scanner-error">
                        {error}
                    </div>
                )}

                {connectionQR && (
                    <div className="scanner-connection">

                        <h3>Connect Your Mobile Phone</h3>

                        <p>
                            Connect your phone to the same Wi-Fi
                            network as this computer.
                        </p>

                        <img
                            src={connectionQR}
                            alt="Mobile scanner connection QR code"
                            style={{
                                width: "250px",
                                maxWidth: "100%",
                                display: "block",
                                margin: "20px auto"
                            }}
                        />

                        <p>
                            Scan this QR code using your phone's
                            camera or QR scanner.
                        </p>

                        <p>
                            <strong>Session status:</strong>{" "}
                            <span>{sessionStatus}</span>
                        </p>

                    </div>
                )}

                {scanResult && (
                    <div
                        className={`mobile-scan-result ${
                            scanResult.success
                                ? "valid"
                                : "invalid"
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
                                    <strong>Seats:</strong>{" "}
                                    {scanResult.booking.seats}
                                </p>

                                <p>
                                    <strong>Payment:</strong>{" "}
                                    {scanResult.booking.payment_status}
                                </p>

                            </div>
                        )}
                    </div>
                )}

                {!scanResult && !loading && !error && (
                    <p>
                        Waiting for the mobile phone to scan a ticket...
                    </p>
                )}

            </div>

        </div>
    );
}

export default QRCodeScanner;