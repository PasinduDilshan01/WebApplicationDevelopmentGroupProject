
import { useEffect, useMemo, useState } from "react";
import {FaFilm,
  FaPlus,FaSearch,
  FaTrash,
  FaClock,
  FaStar,
  FaEdit,
} from "react-icons/fa";

import API from "../services/api";
import "./MovieManagement.css";

function MovieManagement() {

  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [showForm, setShowForm] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    director: "",
    releaseDate: "",
    genre: "",
    duration: "",
    rating: "",
    certificate: "",
    status: "Coming Soon",
    poster: "",
  });

  // LOAD MOVIES FROM MYSQL
  const fetchMovies = async () => {

    try {

      setLoading(true);
      setError("");

      const response = await API.get("/movies/list.php");

      if (response.data.success) {
        setMovies(response.data.movies);
      } else {
        setError(response.data.message || "Unable to load movies.");
      }

    } catch (err) {

      setError(
        err.response?.data?.message ||
        "Unable to connect to the movie server."
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    fetchMovies();
  }, []);


  // SEARCH AND FILTER
  const filteredMovies = useMemo(() => {

    return movies.filter((movie) => {

      const title = (movie.title || "").toLowerCase();
      const genre = (movie.genre || "").toLowerCase();
      const query = search.toLowerCase();

      const matchesSearch =
        title.includes(query) || genre.includes(query);

      const matchesStatus =
        statusFilter === "All Statuses" ||
        movie.status === statusFilter;

      return matchesSearch && matchesStatus;

    });

  }, [movies, search, statusFilter]);


  // RESET FORM
  const resetForm = () => {

    setForm({
      title: "",
      director: "",
      releaseDate: "",
      genre: "",
      duration: "",
      rating: "",
      certificate: "",
      status: "Coming Soon",
      poster: "",
    });

  };


  // ADD MOVIE TO MYSQL
  // ADD OR UPDATE MOVIE
const handleAddMovie = async (e) => {
  e.preventDefault();

  try {
    setSaving(true);
    setError("");

    const movieData = {
      title: form.title.trim(),
      director: form.director.trim(),
      release_date: form.releaseDate,
      genre: form.genre.trim(),
      duration: Number(form.duration),
      rating: form.rating === "" ? null : Number(form.rating),
      certificate: form.certificate.trim(),
      status: form.status,
      poster: form.poster.trim(),
    };

    const response = editingMovieId
      ? await API.put("/movies/update.php", {
          ...movieData,
          id: Number(editingMovieId),
        })
      : await API.post("/movies/create.php", movieData);

    if (response.data.success) {
      alert(
        editingMovieId
          ? "Movie updated successfully!"
          : "Movie added successfully!"
      );

      resetForm();
      setEditingMovieId(null);
      setShowForm(false);

      await fetchMovies();
    } else {
      console.error("Update failed:", response.data);
      setError(response.data.debug_error || response.data.message || "Unable to save movie.");
    }
  } catch (err) {
    console.error("Save movie error:", err);
    console.error("Server response:", err.response?.data);

    setError(
          err.response?.data?.debug_error ||
          err.response?.data?.message ||
      "Unable to connect to the server."
    );
  } finally {
    setSaving(false);
  }
};

  // OPEN EDIT MOVIE FORM
const handleEdit = (movie) => {
  setError("");

  setEditingMovieId(movie.id);

  setForm({
    title: movie.title || "",
    director: movie.director || "",
    releaseDate: movie.release_date || "",
    genre: movie.genre || "",
    duration: movie.duration || "",
    rating: movie.rating ?? "",
    certificate: movie.certificate || "",
    status: movie.status || "Coming Soon",
    poster: movie.poster || "",
  });

  setShowForm(true);
};


  const handleDelete = async (id, title) => {

  const confirmed = window.confirm(
    `Are you sure you want to delete "${title}"?`
  );

  if (!confirmed) return;

  try {

    setError("");

    const response = await API.delete(
      "/movies/delete.php",
      {
        data: { id:Number(id)}
      }
    );
      console.log("Delete response:", response.data);

    if (response.data.success) {

      setMovies((currentMovies) =>
        currentMovies.filter(
          (movie) => Number(movie.id) !== Number(id)
        )
      );

      alert("Movie deleted successfully!");

    }else{  setError(response.data.message || "Movie deletion failed.");

    }

  }catch(err) {
    console.error("Delete movie error:", err);
  console.error("Server response:", err.response?.data);

    setError(
      err.response?.data?.message ||
       err.message ||
      "Unable to delete movie."
    );

  }

};


  return (

    <section className="movie-management">

      <header className="movie-management-header">

        <h1>Movie Catalog Management</h1>

        <button
          className="add-movie-button"
          onClick={() => {
              setError("");
              resetForm();
              setEditingMovieId(null);
              setShowForm(true);
          }}
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


        <span className="movie-total">
          Total: {filteredMovies.length} Movies
        </span>

      </div>


      {error && (
        <p style={{ color: "#ed263f", margin: "15px 0" }}>
          {error}
        </p>
      )}


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

            {loading ? (

              <tr>
                <td colSpan="7" className="no-movies">
                  Loading movies...
                </td>
              </tr>

            ) : filteredMovies.length > 0 ? (

              filteredMovies.map((movie) => (

                <tr key={movie.id}>

                  <td>
                    <div className="movie-poster">

                      {movie.poster ? (
                        <img
                          src={movie.poster}
                          alt={`${movie.title} poster`}
                        />
                      ) : (
                        <FaFilm />
                      )}

                    </div>
                  </td>


                  <td className="movie-details">

                    <strong>{movie.title}</strong>

                    <span>
                      Dir: {movie.director} • Rel: {movie.release_date}
                    </span>

                  </td>


                  <td>{movie.genre || "Not specified"}</td>

                  <td>{movie.duration} mins</td>


                  <td className="movie-rating">

                    <FaStar />{" "}
                    {movie.rating !== null
                      ? Number(movie.rating).toFixed(1)
                      : "N/A"}

                  </td>


                  <td>

                    <span
                      className={`movie-status ${
                        movie.status === "Now Showing"
                          ? "now-showing"
                          : "coming-soon"
                      }`}
                    >
                      <FaClock /> {movie.status}
                    </span>

                  </td>


                  <td>
                    <button
                      className="edit-movie-button"
                      type="button"
                      onClick={() => handleEdit(movie)}
                      title="Edit movie"
                      >
                      <FaEdit />

                    </button>

                    <button
                      className="delete-movie-button"
                      onClick={() => handleDelete(movie.id, movie.title)}
                      aria-label={`Delete ${movie.title}`}
                      title="Delete movie"
                    >
                      <FaTrash />
                    </button>

                  </td>

                </tr>

              ))

            ) : (

              <tr>
                <td colSpan="7" className="no-movies">
                  No movies match your search.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>


      {/* ADD MOVIE MODAL */}
      {showForm && (

        <div className="movie-modal-backdrop">

          <form
            className="movie-form"
            onSubmit={handleAddMovie}
          >

            <h2>{editingMovieId ? "Edit Movie" : "Add New Movie"}</h2>


            <input
              required
              placeholder="Movie title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />


            <input
              required
              placeholder="Director"
              value={form.director}
              onChange={(e) =>
                setForm({ ...form, director: e.target.value })
              }
            />


            <input
              required
              type="date"
              value={form.releaseDate}
              onChange={(e) =>
                setForm({ ...form, releaseDate: e.target.value })
              }
            />


            <input
              required
              placeholder="Genre (e.g. Action, Sci-Fi)"
              value={form.genre}
              onChange={(e) =>
                setForm({ ...form, genre: e.target.value })
              }
            />


            <div className="movie-form-row">

              <input
                required
                type="number"
                min="1"
                placeholder="Duration (mins)"
                value={form.duration}
                onChange={(e) =>
                  setForm({ ...form, duration: e.target.value })
                }
              />


              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="Rating"
                value={form.rating}
                onChange={(e) =>
                  setForm({ ...form, rating: e.target.value })
                }
              />

            </div>


            <input
              required
              placeholder="Certificate (e.g. PG-13)"
              value={form.certificate}
              onChange={(e) =>
                setForm({ ...form, certificate: e.target.value })
              }
            />


            <input
              placeholder="Poster image URL (optional)"
              value={form.poster}
              onChange={(e) =>
                setForm({ ...form, poster: e.target.value })
              }
            />


            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
            >
              <option>Coming Soon</option>
              <option>Now Showing</option>
            </select>


            <div className="movie-form-actions">

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                  setEditingMovieId(null);

                }}
                disabled={saving}
              >
                Cancel
              </button>


              <button type="submit" disabled={saving}>

              {saving? "Saving...": editingMovieId? "Update Movie": "Add Movie"}
              </button>

            </div>

          </form>

        </div>

      )}

    </section>

  );

}

export default MovieManagement;
