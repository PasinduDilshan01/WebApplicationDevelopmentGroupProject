import { useEffect,useMemo, useState } from "react";
import { FaPlus, FaSearch, FaTrash,FaEdit  } from "react-icons/fa";
import "./ShowtimesManagement.css";
import API from "../services/api";


function ShowtimesManagement() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [hallFilter, setHallFilter] = useState("All Cinema Halls");
  const [showForm, setShowForm] = useState(false);
  const [editingShowtimeId, setEditingShowtimeId] = useState(null);

  const [form, setForm] = useState({
  movie_id: "",
  hall_id: "",
  date: "",
  time: "",
  price: "",
});

// LOAD SHOWTIMES FROM MYSQL
const fetchShowtimes = async () => {
  try {
    setLoading(true);
    setError("");

    const response = await API.get("/showtimes/list.php");

    if (response.data.success) {
      setShowtimes(response.data.showtimes);
    } else {
      setError(
        response.data.message || "Unable to load showtimes."
      );
    }
  } catch (err) {
    console.error("Load showtimes error:", err);

    setError(
      err.response?.data?.message ||
      "Unable to connect to the server."
    );
  } finally {
    setLoading(false);
  }
};

// LOAD MOVIES AND CINEMA HALLS FROM MYSQL
const fetchDropdownData = async () => {
  try {
    const [movieResponse, hallResponse] = await Promise.all([
      API.get("/showtimes/movies.php"),
      API.get("/showtimes/halls.php"),
    ]);

    if (movieResponse.data.success) {
      setMovies(movieResponse.data.movies);
    }

    if (hallResponse.data.success) {
      setHalls(hallResponse.data.halls);
    }

  } catch (err) {
    console.error("Dropdown data error:", err);

    setError(
      err.response?.data?.message ||
      "Unable to load movies and cinema halls."
    );
  }
};
useEffect(() => {
  fetchShowtimes();
  fetchDropdownData();
}, []);

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

 // ADD SHOWTIME TO MYSQL
// ADD OR UPDATE SHOWTIME
const handleAddShowtime = async (e) => {
  e.preventDefault();

  try {
    setError("");

    const showtimeData = {
      movie_id: Number(form.movie_id),
      hall_id: Number(form.hall_id),
      date: form.date,
      time: form.time,
      price: Number(form.price),
    };

    let response;

    if (editingShowtimeId !== null) {
      // UPDATE EXISTING SHOWTIME
      response = await API.put("/showtimes/update.php", {
        id: editingShowtimeId,
        ...showtimeData,
      });
    } else {
      // ADD NEW SHOWTIME
      response = await API.post(
        "/showtimes/create.php",
        showtimeData
      );
    }

    if (response.data.success) {
      alert(
        editingShowtimeId !== null
          ? "Showtime updated successfully!"
          : "Showtime scheduled successfully!"
      );

      setForm({
        movie_id: "",
        hall_id: "",
        date: "",
        time: "",
        price: "",
      });

      setEditingShowtimeId(null);
      setShowForm(false);

      await fetchShowtimes();

    } else {
      setError(
        response.data.message || "Unable to save showtime."
      );
    }

  } catch (err) {
    console.error("Save showtime error:", err);
    console.error("Server response:", err.response?.data);

    setError(
      err.response?.data?.message ||
      "Unable to save showtime."
    );
  }
};
// OPEN EDIT SHOWTIME FORM
const handleEdit = (showtime) => {
  setError("");

  setEditingShowtimeId(showtime.id);

  setForm({
    movie_id: String(showtime.movie_id),
    hall_id: String(showtime.hall_id),
    date: showtime.date,
    time: showtime.time,
    price: String(showtime.price),
  });

  setShowForm(true);
};

  const handleReset = () => {
    setSearch("");
    setDateFilter("");
    setHallFilter("All Cinema Halls");
  };

// DELETE SHOWTIME FROM MYSQL
const handleDelete = async (id) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this showtime?"
  );

  if (!confirmed) return;

  try {
    setError("");

    const response = await API.delete("/showtimes/delete.php", {
      data: { id },
    });

    if (response.data.success) {
      alert("Showtime deleted successfully!");

      await fetchShowtimes();
    } else {
      setError(
        response.data.message || "Unable to delete showtime."
      );
    }

  } catch (err) {
    console.error("Delete showtime error:", err);
    console.error("Server response:", err.response?.data);

    setError(
      err.response?.data?.message ||
      "Unable to delete showtime."
    );
  }
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

      {error && (
        <p style={{ color: "#ff6b6b", marginBottom: "15px" }}>
          {error}
        </p>
      )}

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
                <td>${Number(showtime.price).toFixed(2)}</td>                
                <td>{showtime.occupancy}%</td>
                <td>
                  <button
                    type="button"
    onClick={() => handleEdit(showtime)}
    title="Edit showtime"
  >
    <FaEdit />
  </button>

  <button
    type="button"
    className="showtime-delete"
    onClick={() => handleDelete(showtime.id)}
    aria-label={`Delete ${showtime.movie} showtime`}
    title="Delete showtime"
  >
    <FaTrash />
  </button>
</td>
              </tr>
            ))}

            {loading ? (
              <tr>
                <td colSpan="7" className="showtimes-empty">
                  Loading showtimes...
                </td>
              </tr>
            ) : filteredShowtimes.length === 0 ? (
            <tr>
              <td colSpan="7" className="showtimes-empty">
                 No showtimes found.
              </td>
            </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="showtime-modal">
          <form className="showtime-form" onSubmit={handleAddShowtime}>
            <h2>
  {editingShowtimeId !== null
    ? "Edit Showtime"
    : "Schedule New Showtime"}
</h2>

            <select
  required
  value={form.movie_id}
  onChange={(e) =>
    setForm({ ...form, movie_id: e.target.value })
  }
>
  <option value="">Select Movie</option>

  {movies.map((movie) => (
    <option key={movie.id} value={movie.id}>
      {movie.title}
    </option>
  ))}
</select>

           <select
  required
  value={form.hall_id}
  onChange={(e) =>
    setForm({ ...form, hall_id: e.target.value })
  }
>
  <option value="">Select Cinema Hall</option>

  {halls.map((hall) => (
    <option key={hall.id} value={hall.id}>
      {hall.name} - {hall.hall_type}
    </option>
  ))}
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
              <button
                type="button"
                onClick={() => {
                setShowForm(false);
                setEditingShowtimeId(null);

                setForm({
                  movie_id: "",
                  hall_id: "",
                  date: "",
                  time: "",
                  price: "",
                });
              }}
              >
                 Cancel
              </button>
              <button type="submit">
  {editingShowtimeId !== null
    ? "Update Showtime"
    : "Save Showtime"}
</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default ShowtimesManagement;