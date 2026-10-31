import { useMemo, useState } from "react";
import {
  FaFilm,
  FaPlus,
  FaSearch,
  FaTrash,
  FaClock,
  FaStar,
} from "react-icons/fa";
import "./MovieManagement.css";

const initialMovies = [
  {
    id: 1,
    title: "Kingdom of the Planet of the Apes",
    director: "Wes Ball",
    releaseDate: "May 10, 2026",
    genre: "Action, Sci-Fi, Adventure",
    duration: 145,
    rating: 8.2,
    status: "Coming Soon",
    poster: "",
  },
  {
    id: 2,
    title: "Interstellar",
    director: "Christopher Nolan",
    releaseDate: "Nov 7, 2026",
    genre: "Sci-Fi, Drama",
    duration: 169,
    rating: 8.7,
    status: "Now Showing",
    poster: "",
  },
];

function MovieManagement() {
  const [movies, setMovies] = useState(initialMovies);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    director: "",
    releaseDate: "",
    genre: "",
    duration: "",
    rating: "",
    status: "Coming Soon",
  });

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesSearch =
        movie.title.toLowerCase().includes(search.toLowerCase()) ||
        movie.genre.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All Statuses" || movie.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [movies, search, statusFilter]);

  const handleAddMovie = (e) => {
    e.preventDefault();

    const newMovie = {
      ...form,
      id: Date.now(),
      duration: Number(form.duration),
      rating: Number(form.rating),
      poster: "",
    };

    setMovies((current) => [newMovie, ...current]);
    setForm({
      title: "",
      director: "",
      releaseDate: "",
      genre: "",
      duration: "",
      rating: "",
      status: "Coming Soon",
    });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setMovies((current) => current.filter((movie) => movie.id !== id));
  };

  return (
    <section className="movie-management">
      <header className="movie-management-header">
        <h1>Movie Catalog Management</h1>

        <button
          className="add-movie-button"
          onClick={() => setShowForm(true)}
        >
          <FaPlus /> Add New Movie
        </button>
      </header>

      <div className="movie-filters">
        <label className="movie-search">
          <FaSearch />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movies or genres..."
          />
        </label>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by movie status"
        >
          <option>All Statuses</option>
          <option>Now Showing</option>
          <option>Coming Soon</option>
        </select>

        <span className="movie-total">Total: {filteredMovies.length} Movies</span>
      </div>

      <div className="movie-table-wrapper">
        <table className="movie-table">
          <thead>
            <tr>
              <th>Poster</th>
              <th>Movie Details</th>
              <th>Genre</th>
              <th>Duration</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredMovies.map((movie) => (
              <tr key={movie.id}>
                <td>
                  <div className="movie-poster">
                    {movie.poster ? (
                      <img src={movie.poster} alt={`${movie.title} poster`} />
                    ) : (
                      <FaFilm />
                    )}
                  </div>
                </td>

                <td className="movie-details">
                  <strong>{movie.title}</strong>
                  <span>
                    Dir: {movie.director} • Rel: {movie.releaseDate}
                  </span>
                </td>

                <td>{movie.genre}</td>
                <td>{movie.duration} mins</td>

                <td className="movie-rating">
                  <FaStar /> {movie.rating.toFixed(1)}
                </td>

                <td>
                  <span
                    className={`movie-status ${
                      movie.status === "Now Showing" ? "now-showing" : "coming-soon"
                    }`}
                  >
                    <FaClock /> {movie.status}
                  </span>
                </td>

                <td>
                  <button
                    className="delete-movie-button"
                    onClick={() => handleDelete(movie.id)}
                    aria-label={`Delete ${movie.title}`}
                    title="Delete movie"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}

            {filteredMovies.length === 0 && (
              <tr>
                <td colSpan="7" className="no-movies">
                  No movies match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="movie-modal-backdrop">
          <form className="movie-form" onSubmit={handleAddMovie}>
            <h2>Add New Movie</h2>

            <input
              required
              placeholder="Movie title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <input
              required
              placeholder="Director"
              value={form.director}
              onChange={(e) => setForm({ ...form, director: e.target.value })}
            />

            <input
              required
              placeholder="Release date"
              value={form.releaseDate}
              onChange={(e) =>
                setForm({ ...form, releaseDate: e.target.value })
              }
            />

            <input
              required
              placeholder="Genre"
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
            />

            <div className="movie-form-row">
              <input
                required
                type="number"
                min="1"
                placeholder="Duration (mins)"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />

              <input
                required
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="Rating"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
              />
            </div>

            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Coming Soon</option>
              <option>Now Showing</option>
            </select>

            <div className="movie-form-actions">
              <button type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit">Add Movie</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default MovieManagement;