import { useMemo, useState } from "react";
import { FaSearch, FaSyncAlt } from "react-icons/fa";
import "./BookingLedger.css";

const sampleBookings = [
  {
    id: "CNM-2026-WN5DJ",
    date: "2026-09-10",
    customer: "customer@cinema.com",
    movie: "Midnight in Venice",
    screening: "VIP Luxury Lounge 3",
    screeningDate: "Thu, Sep 10, 2026 1:45 PM",
    seats: ["A1", "A2", "A3"],
    amount: 49.5,
    payment: "Credit Card",
    status: "Cancelled",
  },
  {
    id: "CNM-2026-AB821",
    date: "2026-09-12",
    customer: "alex@example.com",
    movie: "Interstellar",
    screening: "Hall 1",
    screeningDate: "Sat, Sep 12, 2026 6:30 PM",
    seats: ["B4", "B5"],
    amount: 25,
    payment: "Debit Card",
    status: "Confirmed",
  },
];

function BookingLedger() {
  const [bookings, setBookings] = useState(sampleBookings);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Booking Statuses");
  const [dateFilter, setDateFilter] = useState("");

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        booking.id.toLowerCase().includes(searchText) ||
        booking.customer.toLowerCase().includes(searchText) ||
        booking.movie.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All Booking Statuses" ||
        booking.status === statusFilter;

      const matchesDate = !dateFilter || booking.date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, search, statusFilter, dateFilter]);

  const refreshLedger = () => {
    // Replace this with your API refresh when your backend is ready.
    setBookings((current) => [...current]);
  };

  return (
    <section className="booking-ledger">
      <header className="ledger-header">
        <h1>Customer Booking Transactions</h1>
        <button className="ledger-refresh" onClick={refreshLedger}>
          <FaSyncAlt /> Refresh Ledger
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
            {filteredBookings.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <strong className="booking-ref">{booking.id}</strong>
                  <span className="ledger-subtext">{booking.screeningDate}</span>
                </td>

                <td>{booking.customer}</td>

                <td>
                  <strong>{booking.movie}</strong>
                  <span className="ledger-subtext">
                    {booking.screening} • {booking.screeningDate}
                  </span>
                </td>

                <td>
                  <span className="seat-count">
                    {booking.seats.length} Seats
                  </span>
                  <span className="ledger-subtext">
                    {booking.seats.join(", ")}
                  </span>
                </td>

                <td>
                  <strong className="ledger-amount">
                    ${booking.amount.toFixed(2)}
                  </strong>
                  <span className="ledger-subtext">{booking.payment}</span>
                </td>

                <td>
                  <span
                    className={`booking-status ${booking.status.toLowerCase()}`}
                  >
                    {booking.status}
                  </span>
                </td>

                <td>
                  <button
                    className="ledger-action"
                    onClick={() =>
                      setBookings((current) =>
                        current.filter((item) => item.id !== booking.id)
                      )
                    }
                    title="Remove sample booking"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}

            {filteredBookings.length === 0 && (
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