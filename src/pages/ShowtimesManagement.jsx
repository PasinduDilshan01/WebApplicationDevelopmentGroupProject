import { useMemo, useState } from "react";
import { FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import "./ShowtimesManagement.css";

const initialShowtimes = [
  {
    id: 1,
    movie: "Interstellar",
    hall: "Hall 1",
    date: "2026-11-02",
    time: "18:30",
    price: 12.5,
    occupancy: "65%",
  },
  {
    id: 2,
    movie: "Inception",
    hall: "Hall 2",
    date: "2026-11-02",
    time: "20:00",
    price: 10,
    occupancy: "42%",
  },
];

function ShowtimesManagement() {
  const [showtimes, setShowtimes] = useState(initialShowtimes);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [hallFilter, setHallFilter] = useState("All Cinema Halls");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    movie: "",
    hall: "Hall 1",
    date: "",
    time: "",
    price: "",
  });

  const filteredShowtimes = useMemo(() => {
    return showtimes.filter((showtime) => {
      const matchesSearch = showtime.movie
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesDate = !dateFilter || showtime.date === dateFilter;

      const matchesHall =
        hallFilter === "All Cinema Halls" || showtime.hall === hallFilter;

      return matchesSearch && matchesDate && matchesHall;
    });
  }, [showtimes, search, dateFilter, hallFilter]);

  const handleAddShowtime = (e) => {
    e.preventDefault();

    setShowtimes((current) => [
      ...current,
      {
        ...form,
        id: Date.now(),
        price: Number(form.price),
        occupancy: "0%",
      },
    ]);

    setForm({
      movie: "",
      hall: "Hall 1",
      date: "",
      time: "",
      price: "",
    });

    setShowForm(false);
  };

  const handleReset = () => {
    setSearch("");
    setDateFilter("");
    setHallFilter("All Cinema Halls");
  };

  const handleDelete = (id) => {
    setShowtimes((current) => current.filter((item) => item.id !== id));
  };

  return (
    <section className="showtimes-page">
      <header className="showtimes-header">
        <h1>Showtimes &amp; Schedule Management</h1>
        <button onClick={() => setShowForm(true)}>
          <FaPlus /> Schedule New Showtime
        </button>
      </header>

      <div className="showtimes-filters">
        <label className="showtime-search">
          <FaSearch />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movie..."
          />
        </label>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          aria-label="Filter by date"
        />

        <select
          value={hallFilter}
          onChange={(e) => setHallFilter(e.target.value)}
          aria-label="Filter by cinema hall"
        >
          <option>All Cinema Halls</option>
          <option>Hall 1</option>
          <option>Hall 2</option>
          <option>Hall 3</option>
        </select>

        <button className="reset-filters" onClick={handleReset}>
          Reset Filters
        </button>
      </div>

      <div className="showtimes-table-wrap">
        <table className="showtimes-table">
          <thead>
            <tr>
              <th>Movie</th>
              <th>Cinema Hall</th>
              <th>Date</th>
              <th>Timing</th>
              <th>Base Ticket Price</th>
              <th>Occupancy</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredShowtimes.map((showtime) => (
              <tr key={showtime.id}>
                <td>{showtime.movie}</td>
                <td>{showtime.hall}</td>
                <td>{showtime.date}</td>
                <td>{showtime.time}</td>
                <td>${showtime.price.toFixed(2)}</td>
                <td>{showtime.occupancy}</td>
                <td>
                  <button
                    className="showtime-delete"
                    onClick={() => handleDelete(showtime.id)}
                    aria-label={`Delete ${showtime.movie} showtime`}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}

            {filteredShowtimes.length === 0 && (
              <tr>
                <td colSpan="7" className="showtimes-empty">
                  No showtimes match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="showtime-modal">
          <form className="showtime-form" onSubmit={handleAddShowtime}>
            <h2>Schedule New Showtime</h2>

            <input
              required
              placeholder="Movie title"
              value={form.movie}
              onChange={(e) => setForm({ ...form, movie: e.target.value })}
            />

            <select
              value={form.hall}
              onChange={(e) => setForm({ ...form, hall: e.target.value })}
            >
              <option>Hall 1</option>
              <option>Hall 2</option>
              <option>Hall 3</option>
            </select>

            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />

            <input
              required
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />

            <input
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="Base ticket price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            <div className="showtime-form-actions">
              <button type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit">Save Showtime</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default ShowtimesManagement;