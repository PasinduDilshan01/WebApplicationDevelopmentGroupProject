import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaCouch,
  FaArrowLeft,
  FaTicketAlt,
} from "react-icons/fa";

import API from "../services/api";
import "./SeatSelection.css";

function SeatSelection() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();

  const [seats, setSeats] = useState([]);
  const [showtime, setShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Retrieve seats and showtime information
  const fetchSeats = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(
        `/seats/available.php?showtime_id=${showtimeId}`
      );

      if (response.data.success) {
        setSeats(response.data.seats || []);
        setShowtime(response.data.showtime);
      } else {
        setError(
          response.data.message || "Unable to load seats."
        );
      }
    } catch (err) {
      console.error("Seat loading error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to retrieve seats."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
  }, [showtimeId]);

  // Select or deselect a seat
  const handleSeatClick = (seat) => {
    if (seat.status !== "Available") {
      return;
    }

    setSelectedSeats((current) => {
      if (current.some((item) => item.id === seat.id)) {
        return current.filter((item) => item.id !== seat.id);
      }

      return [...current, seat];
    });
  };

  // Calculate total price
  const totalPrice =
    selectedSeats.length *
    Number(showtime?.ticket_price || 0);

  // Continue to booking
  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }

    navigate("/booking/confirm", {
      state: {
        showtimeId: Number(showtimeId),
        seatIds: selectedSeats.map((seat) => seat.id),
      },
    });
  };

  if (loading) {
    return (
      <div className="seat-message">
        Loading seats...
      </div>
    );
  }

  if (error) {
    return (
      <div className="seat-message seat-error">
        {error}
      </div>
    );
  }

  return (
    <div className="seat-selection-page">

      <div className="seat-page-header">

        <button
          className="seat-back-button"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          Back
        </button>

        <h2>Select Your Seats</h2>

      </div>

      {showtime && (
        <div className="seat-movie-information">

          <h3>{showtime.movie}</h3>

          <p>
            {showtime.hall}
          </p>

          <p>
            {showtime.show_date} | {showtime.show_time}
          </p>

        </div>
      )}

      <div className="seat-screen">
        SCREEN
      </div>

      <div className="seat-layout">

        {seats.map((seat) => {

          const isSelected = selectedSeats.some(
            (item) => item.id === seat.id
          );

          return (
            <button
              key={seat.id}
              className={`cinema-seat ${
                seat.status === "Booked"
                  ? "booked"
                  : isSelected
                    ? "selected"
                    : "available"
              }`}
              disabled={seat.status !== "Available"}
              onClick={() => handleSeatClick(seat)}
              title={`Seat ${seat.seat_number}`}
            >
              <FaCouch />
              <span>{seat.seat_number}</span>
            </button>
          );
        })}

      </div>

      <div className="seat-legend">

        <div>
          <span className="legend-box available"></span>
          Available
        </div>

        <div>
          <span className="legend-box selected"></span>
          Selected
        </div>

        <div>
          <span className="legend-box booked"></span>
          Booked
        </div>

      </div>

      <div className="seat-summary">

        <div>
          <p>Selected Seats</p>

          <h4>
            {selectedSeats.length > 0
              ? selectedSeats
                  .map((seat) => seat.seat_number)
                  .join(", ")
              : "None"}
          </h4>
        </div>

        <div>
          <p>Total Amount</p>

          <h3>
            LKR {totalPrice.toFixed(2)}
          </h3>
        </div>

        <button
          className="seat-continue-button"
          onClick={handleContinue}
          disabled={selectedSeats.length === 0}
        >
          <FaTicketAlt />
          Continue
        </button>

      </div>

    </div>
  );
}

export default SeatSelection;