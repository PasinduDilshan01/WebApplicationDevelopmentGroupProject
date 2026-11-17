import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  FaQrcode,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaTicketAlt,
} from "react-icons/fa";
import API from "../services/api";

const QRCodeScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    let scanHandled = false;

    const onScanSuccess = async (decodedText) => {
      if (scanHandled || processing) return;

      scanHandled = true;
      setProcessing(true);
      setError("");
      setScanResult(null);

      // Stop scanning while the ticket is being checked.
      try {
        await scanner.clear();

        const response = await API.post("/bookings/verify_ticket.php", {
          ticket_code: decodedText,
        });

        if (response.data.success) {
          setScanResult(response.data.booking);
        } else {
          setError(response.data.message || "Ticket is not valid.");
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to verify ticket. Please check the connection and try again."
        );
      } finally {
        setProcessing(false);
      }
    };

    scanner.render(onScanSuccess, () => {});

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scannerKey]);

  const handleScanAgain = () => {
    setScanResult(null);
    setError("");
    setProcessing(false);
    setScannerKey((previous) => previous + 1);
  };

  return (
    <div className="qr-scanner-page">
      <div className="qr-scanner-header">
        <div>
          <h2>
            <FaQrcode /> QR Ticket Scanner
          </h2>
          <p>Scan a customer's ticket to verify its validity.</p>
        </div>
      </div>

      <div className="qr-scanner-content">
        {!scanResult && !error && (
          <div className="qr-scanner-card">
            <h3>Scan Ticket QR Code</h3>
            <p>
              Position the customer's QR code inside the scanner frame.
            </p>

            <div id="qr-reader"></div>

            {processing && (
              <div className="qr-processing">
                <FaSpinner className="qr-spinner" />
                <span>Verifying ticket...</span>
              </div>
            )}
          </div>
        )}

        {scanResult && (
          <div className="qr-result-card qr-valid">
            <FaCheckCircle className="qr-result-icon" />

            <h3>Ticket Valid</h3>
            <p className="qr-result-message">
              Ticket verified successfully. This ticket has now been marked
              as used.
            </p>

            <div className="qr-booking-details">
              <h4>
                <FaTicketAlt /> Booking Details
              </h4>

              <div className="qr-detail-row">
                <span>Booking Reference</span>
                <strong>{scanResult.booking_reference}</strong>
              </div>

              <div className="qr-detail-row">
                <span>Customer</span>
                <strong>{scanResult.customer_name}</strong>
              </div>

              <div className="qr-detail-row">
                <span>Movie</span>
                <strong>{scanResult.movie_title}</strong>
              </div>

              <div className="qr-detail-row">
                <span>Cinema Hall</span>
                <strong>{scanResult.hall_name}</strong>
              </div>

              <div className="qr-detail-row">
                <span>Show Date</span>
                <strong>{scanResult.show_date}</strong>
              </div>

              <div className="qr-detail-row">
                <span>Show Time</span>
                <strong>{scanResult.show_time}</strong>
              </div>

              <div className="qr-detail-row">
                <span>Seats</span>
                <strong>{scanResult.seats}</strong>
              </div>

              <div className="qr-detail-row">
                <span>Payment</span>
                <strong>{scanResult.payment_status}</strong>
              </div>

              <div className="qr-detail-row">
                <span>Ticket Status</span>
                <strong>{scanResult.ticket_status}</strong>
              </div>
            </div>

            <button className="qr-scan-again-btn" onClick={handleScanAgain}>
              <FaQrcode /> Scan Next Ticket
            </button>
          </div>
        )}

        {error && (
          <div className="qr-result-card qr-invalid">
            <FaTimesCircle className="qr-result-icon" />

            <h3>Ticket Invalid</h3>
            <p className="qr-result-message">{error}</p>

            <button className="qr-scan-again-btn" onClick={handleScanAgain}>
              <FaQrcode /> Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeScanner;