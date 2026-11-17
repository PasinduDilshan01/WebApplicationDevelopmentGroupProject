import { useEffect, useMemo, useState } from "react";
import { FaSearch, FaSyncAlt } from "react-icons/fa";
import API from "../services/api";
import "./BookingLedger.css";

function BookingLedger() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Booking Statuses");
  const [dateFilter, setDateFilter] = useState("");

  // LOAD BOOKINGS FROM MYSQL
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/bookings/list.php");

      if (response.data.success) {
        setBookings(response.data.bookings);
      } else {
        setError(
          response.data.message || "Unable to load bookings."
        );
      }

    } catch (err) {
      console.error("Load bookings error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to connect to the server."
      );

    } finally {
      setLoading(false);
    }
  };

  // LOAD BOOKINGS WHEN PAGE OPENS
  useEffect(() => {
    fetchBookings();
  }, []);

  // REFRESH LEDGER
  const refreshLedger = () => {
    fetchBookings();
  };

  // UPDATE BOOKING STATUS IN MYSQL
const handleStatusUpdate = async (bookingId, newStatus) => {
  const confirmed = window.confirm(
    `Are you sure you want to mark this booking as ${newStatus}?`
  );

  if (!confirmed) return;

  try {
    setError("");

    const response = await API.put(
      "/bookings/update_status.php",
      {
        id: bookingId,
        status: newStatus,
      }
    );

    if (response.data.success) {
      alert(response.data.message);

      // Reload bookings from MySQL
      await fetchBookings();
    } else {
      setError(
        response.data.message || "Unable to update booking status."
      );
    }

  } catch (err) {
    console.error("Booking status update error:", err);
    console.error("Server response:", err.response?.data);

    setError(
      err.response?.data?.message ||
      "Unable to update booking status."
    );
  }
};

  // FILTER BOOKINGS
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        (booking.booking_reference || "").toLowerCase().includes(searchText) ||
        (booking.customer || "").toLowerCase().includes(searchText) ||
        (booking.movie || "").toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All Booking Statuses" ||
        booking.status === statusFilter;

      const bookingDate = booking.created_at
        ? booking.created_at.substring(0, 10)
        : "";

      const matchesDate =
        !dateFilter || bookingDate === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, search, statusFilter, dateFilter]);

  return (
    <section className="booking-ledger">

      <header className="ledger-header">
        <h1>Customer Booking Transactions</h1>

        <button
          className="ledger-refresh"
          onClick={refreshLedger}
          disabled={loading}
        >
          <FaSyncAlt />
          {loading ? "Refreshing..." : "Refresh Ledger"}
        </button>
      </header>

      <div className="ledger-filters">

        <label className="ledger-search">
          <FaSearch />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking, customer, or movie..."
          />
        </label>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by booking status"
        >
          <option>All Booking Statuses</option>
          <option>Confirmed</option>
          <option>Cancelled</option>
          <option>Pending</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          aria-label="Filter by booking date"
        />

        <span className="ledger-total">
          Total: {filteredBookings.length} Bookings
        </span>

      </div>

      {error && (
        <p style={{ color: "#ff6b6b", marginBottom: "15px" }}>
          {error}
        </p>
      )}

      <div className="ledger-table-wrap">

        <table className="ledger-table">

          <thead>
            <tr>
              <th>Booking Ref</th>
              <th>Customer</th>
              <th>Movie &amp; Screening</th>
              <th>Seats</th>
              <th>Financials</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td colSpan="7" className="ledger-empty">
                  Loading booking records...
                </td>
              </tr>

            ) : filteredBookings.length > 0 ? (

              filteredBookings.map((booking) => {

                const seatList = booking.seats
                  ? booking.seats.split(", ").filter(Boolean)
                  : [];

                return (
                  <tr key={booking.id}>

                    {/* BOOKING REFERENCE */}
                    <td>
                      <strong className="booking-ref">
                        {booking.booking_reference}
                      </strong>

                      <span className="ledger-subtext">
                        {booking.created_at}
                      </span>
                    </td>

                    {/* CUSTOMER */}
                    <td>
                      {booking.customer}
                    </td>

                    {/* MOVIE AND SCREENING */}
                    <td>
                      <strong>
                        {booking.movie}
                      </strong>

                      <span className="ledger-subtext">
                        {booking.screening} • {booking.show_date} {booking.show_time}
                      </span>
                    </td>

                    {/* SEATS */}
                    <td>
                      <span className="seat-count">
                        {seatList.length} Seats
                      </span>

                      <span className="ledger-subtext">
                        {seatList.length > 0
                          ? seatList.join(", ")
                          : "No seats recorded"}
                      </span>
                    </td>

                    {/* FINANCIALS */}
                    <td>
                      <strong className="ledger-amount">
                        ${Number(booking.total_amount).toFixed(2)}
                      </strong>

                      <span className="ledger-subtext">
                        {booking.payment}
                      </span>
                    </td>

                    {/* BOOKING STATUS */}
                    <td>
                      <span
                        className={`booking-status ${
                          (booking.status || "").toLowerCase()
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                      <td className="booking-actions">

                      {booking.status === "Pending" && (
                      <button
                        type="button"
                        className="booking-confirm-button"
                        onClick={() =>
                        handleStatusUpdate(booking.id, "Confirmed")
                      }
    >
      Confirm
    </button>
  )}

  {booking.status !== "Cancelled" && (
    <button
      type="button"
      className="booking-cancel-button"
      onClick={() =>
        handleStatusUpdate(booking.id, "Cancelled")
      }
    >
      Cancel
    </button>
  )}

</td>
                  </tr>
                );
              })

            ) : (

              <tr>
                <td colSpan="7" className="ledger-empty">
                  No bookings match these filters.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>

    </section>
  );
}

export default BookingLedger;