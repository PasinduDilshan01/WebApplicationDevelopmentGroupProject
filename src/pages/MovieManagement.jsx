import { useEffect, useMemo, useState } from "react";

import {
    FaFilm,
    FaPlus,
    FaSearch,
    FaTrash,
    FaClock,
    FaStar,
    FaEdit,
    FaUpload,
    FaTimes
} from "react-icons/fa";

import API from "../services/api";
import "./MovieManagement.css";


// BUILD POSTER IMAGE URL
const getPosterUrl = (poster) => {

    if (!poster) return "";

    if (
        poster.startsWith("http://") ||
        poster.startsWith("https://") ||
        poster.startsWith("data:")
    ) {
        return poster;
    }

    return `/${poster.replace(/^\/+/, "")}`;
};


// AVAILABLE GENRES
const GENRES = [
    "Action",
    "Adventure",
    "Animation",
    "Crime",
    "Drama",
    "Family",
    "Fantasy",
    "Horror",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Thriller"
];


function MovieManagement() {

    const [movies, setMovies] = useState([]);

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState("All Statuses");

    const [showForm, setShowForm] = useState(false);

    const [editingMovieId, setEditingMovieId] = useState(null);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    const [posterFile, setPosterFile] = useState(null);

    const [posterPreview, setPosterPreview] = useState("");


    const [form, setForm] = useState({

        title: "",
        director: "",
        releaseDate: "",
        genre: "",
        duration: "",
        rating: "",
        certificate: "",
        status: "Coming Soon",
        poster: ""

    });


    // LOAD MOVIES FROM DATABASE
    const fetchMovies = async () => {

        try {

            setLoading(true);

            setError("");

            const response = await API.get("/movies/list.php");

            if (response.data.success) {

                setMovies(response.data.movies || []);

            } else {

                setError(
                    response.data.message || "Unable to load movies."
                );

            }

        } catch (err) {

            console.error("Fetch movies error:", err);

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
            poster: ""

        });

        setPosterFile(null);

        if (posterPreview) {
            URL.revokeObjectURL(posterPreview);
        }

        setPosterPreview("");

    };


    // SELECT POSTER IMAGE
    const handlePosterChange = (e) => {

        const file = e.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {

            setError("Please select a JPG, PNG or WEBP image.");

            e.target.value = "";

            return;

        }

        if (file.size > 5 * 1024 * 1024) {

            setError("Poster image must be smaller than 5 MB.");

            e.target.value = "";

            return;

        }

        setError("");

        setPosterFile(file);

        if (posterPreview) {
            URL.revokeObjectURL(posterPreview);
        }

        const previewUrl = URL.createObjectURL(file);

        setPosterPreview(previewUrl);

    };


    // ADD OR UPDATE MOVIE
    const handleAddMovie = async (e) => {

        e.preventDefault();

        try {

            setSaving(true);

            setError("");

            const movieData = new FormData();

            movieData.append("title", form.title.trim());

            movieData.append("director", form.director.trim());

            movieData.append("release_date", form.releaseDate);

            movieData.append("genre", form.genre);

            movieData.append("duration", form.duration);

            movieData.append("rating", form.rating);

            movieData.append("certificate", form.certificate.trim());

            movieData.append("status", form.status);


            if (posterFile) {

                movieData.append("poster", posterFile);

            }


            let response;

            if (editingMovieId) {

                movieData.append("id", Number(editingMovieId));

                response = await API.post(
                    "/movies/update.php",
                    movieData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data"
                        }
                    }
                );

            } else {

                response = await API.post(
                    "/movies/create.php",
                    movieData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data"
                        }
                    }
                );

            }


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

                setError(
                    response.data.message || "Unable to save movie."
                );

            }

        } catch (err) {

            console.error("Save movie error:", err);

            console.error("Server response:", err.response?.data);

            setError(
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

        const firstGenre = (movie.genre || "")
            .split(",")[0]
            .trim();

        setForm({

            title: movie.title || "",

            director: movie.director || "",

            releaseDate: movie.release_date || "",

            genre: firstGenre,

            duration: movie.duration || "",

            rating: movie.rating ?? "",

            certificate: movie.certificate || "",

            status: movie.status || "Coming Soon",

            poster: movie.poster || ""

        });

        setPosterFile(null);

        if (posterPreview) {
            URL.revokeObjectURL(posterPreview);
        }

        setPosterPreview("");

        setShowForm(true);

    };


    // DELETE MOVIE
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
                    data: {
                        id: Number(id)
                    }
                }
            );

            if (response.data.success) {

                setMovies((currentMovies) =>
                    currentMovies.filter(
                        (movie) => Number(movie.id) !== Number(id)
                    )
                );

                alert("Movie deleted successfully!");

            } else {

                setError(
                    response.data.message || "Movie deletion failed."
                );

            }

        } catch (err) {

            console.error("Delete movie error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to delete movie."
            );

        }

    };


    // CLOSE FORM
    const handleCloseForm = () => {

        if (saving) return;

        setShowForm(false);

        setEditingMovieId(null);

        resetForm();

        setError("");

    };


    return (

        <section className="movie-management">


            {/* HEADER */}
            <header className="movie-management-header">

                <h1>Movie Catalog Management</h1>

                <button
                    className="add-movie-button"
                    type="button"
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


            {/* FILTERS */}
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


            {/* ERROR MESSAGE */}
            {error && !showForm && (

                <p className="movie-error">
                    {error}
                </p>

            )}


            {/* MOVIE TABLE */}
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

                                    {/* POSTER */}
                                    <td>

                                        <div className="movie-poster">

                                            {movie.poster ? (

                                                <img
                                                    src={getPosterUrl(movie.poster)}
                                                    alt={`${movie.title} poster`}
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.style.display = "none";
                                                        console.error(
                                                            "Poster failed to load:",
                                                            e.currentTarget.src
                                                        );
                                                    }}
                                                />

                                            ) : (

                                                <FaFilm />

                                            )}

                                        </div>

                                    </td>


                                    {/* MOVIE DETAILS */}
                                    <td className="movie-details">

                                        <strong>{movie.title}</strong>

                                        <span>
                                            Dir: {movie.director} • Rel: {movie.release_date}
                                        </span>

                                    </td>


                                    {/* GENRE */}
                                    <td>
                                        {movie.genre || "Not specified"}
                                    </td>


                                    {/* DURATION */}
                                    <td>
                                        {movie.duration} mins
                                    </td>


                                    {/* RATING */}
                                    <td className="movie-rating">

                                        <FaStar />{" "}

                                        {movie.rating !== null
                                            ? Number(movie.rating).toFixed(1)
                                            : "N/A"}

                                    </td>


                                    {/* STATUS */}
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


                                    {/* ACTIONS */}
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
                                            type="button"
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


            {/* ADD / EDIT MOVIE MODAL */}
            {showForm && (

                <div className="movie-modal-backdrop">

                    <form
                        className="movie-form"
                        onSubmit={handleAddMovie}
                    >

                        <h2>
                            {editingMovieId ? "Edit Movie" : "Add New Movie"}
                        </h2>


                        {error && (

                            <p className="movie-error">
                                {error}
                            </p>

                        )}


                        {/* TITLE */}
                        <input
                            required
                            placeholder="Movie title"
                            value={form.title}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    title: e.target.value
                                })
                            }
                        />


                        {/* DIRECTOR */}
                        <input
                            required
                            placeholder="Director"
                            value={form.director}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    director: e.target.value
                                })
                            }
                        />


                        {/* RELEASE DATE */}
                        <input
                            required
                            type="date"
                            value={form.releaseDate}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    releaseDate: e.target.value
                                })
                            }
                        />


                        {/* GENRE */}
                        <select
                            required
                            value={form.genre}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    genre: e.target.value
                                })
                            }
                        >

                            <option value="">Select Genre</option>

                            {GENRES.map((genre) => (

                                <option key={genre} value={genre}>
                                    {genre}
                                </option>

                            ))}

                        </select>


                        {/* DURATION AND RATING */}
                        <div className="movie-form-row">

                            <input
                                required
                                type="number"
                                min="1"
                                placeholder="Duration (mins)"
                                value={form.duration}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        duration: e.target.value
                                    })
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
                                    setForm({
                                        ...form,
                                        rating: e.target.value
                                    })
                                }
                            />

                        </div>


                        {/* CERTIFICATE */}
                        <input
                            required
                            placeholder="Certificate (e.g. PG-13)"
                            value={form.certificate}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    certificate: e.target.value
                                })
                            }
                        />


                        {/* POSTER UPLOAD */}
                        <div className="poster-upload-section">

                            <label htmlFor="poster-upload">

                                <FaUpload />

                                Upload Movie Poster

                            </label>


                            <input
                                id="poster-upload"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePosterChange}
                            />


                            <small>
                                JPG, PNG or WEBP. Maximum size: 5 MB.
                            </small>


                            {/* POSTER PREVIEW */}
                            {(posterPreview || form.poster) && (

                                <div className="poster-preview">

                                    <img
                                        src={
                                            posterPreview ||
                                            getPosterUrl(form.poster)
                                        }
                                        alt="Movie poster preview"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            console.error(
                                                "Poster preview failed:",
                                                e.currentTarget.src
                                            );
                                        }}
                                    />


                                    <button
                                        type="button"
                                        onClick={() => {

                                            setPosterFile(null);

                                            if (posterPreview) {
                                                URL.revokeObjectURL(posterPreview);
                                            }

                                            setPosterPreview("");

                                            setForm({
                                                ...form,
                                                poster: ""
                                            });

                                            const input = document.getElementById(
                                                "poster-upload"
                                            );

                                            if (input) input.value = "";

                                        }}
                                        title="Remove poster"
                                    >

                                        <FaTimes />

                                    </button>

                                </div>

                            )}

                        </div>


                        {/* MOVIE STATUS */}
                        <select
                            value={form.status}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    status: e.target.value
                                })
                            }
                        >

                            <option>Coming Soon</option>

                            <option>Now Showing</option>

                        </select>


                        {/* FORM BUTTONS */}
                        <div className="movie-form-actions">

                            <button
                                type="button"
                                onClick={handleCloseForm}
                                disabled={saving}
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                                disabled={saving}
                            >

                                {saving
                                    ? "Saving..."
                                    : editingMovieId
                                        ? "Update Movie"
                                        : "Add Movie"}

                            </button>

                        </div>

                    </form>

                </div>

            )}

        </section>

    );

}

export default MovieManagement;