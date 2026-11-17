import { useState, useEffect } from "react";

import {
  FaSlidersH,
  FaSearch,
  FaStar,
  FaClock,
  FaTicketAlt
} from "react-icons/fa";

import { Link } from "react-router-dom";

import API from "../services/api";

import "./Movies.css";


function Movies() {

  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [status, setStatus] = useState("All Movies");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("title");

  // DATABASE MOVIES
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // FETCH MOVIES FROM PHP API
  useEffect(() => {

    const fetchMovies = async () => {

      try {

        setLoading(true);
        setError("");

        const response = await API.get("/movies/list.php");

        if (response.data.success) {

          const formattedMovies = response.data.movies.map((movie) => {

            let movieGenres = movie.genres || movie.genre || [];

            if (typeof movieGenres === "string") {
              movieGenres = movieGenres
                ? movieGenres.split(",").map((genre) => genre.trim())
                : [];
            }

           return {
    ...movie,
    id: Number(movie.id),
    rating: Number(movie.rating) || 0,
    customer_rating: Number(movie.customer_rating) || 0,
    total_reviews: Number(movie.total_reviews) || 0,
    duration: Number(movie.duration) || 0,
    genre: movieGenres,
    poster: movie.poster || "",
    status: movie.status
};
          });

          setMovies(formattedMovies);

        } else {

          setError(
            response.data.message || "Unable to load movies."
          );

        }

      } catch (err) {

        console.error("Movie loading error:", err);

        setError(
          err.response?.data?.message ||
          "Unable to connect to the movie database."
        );

      } finally {

        setLoading(false);

      }

    };

    fetchMovies();

  }, []);


  // AVAILABLE GENRES
  const genres = [
    "All",
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


  // FILTER MOVIES
  let filteredMovies = movies.filter((movie) => {

    const matchesSearch = movie.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesGenre =
      selectedGenre === "All" ||
      movie.genre.some(
        (genre) =>
          genre.toLowerCase() === selectedGenre.toLowerCase()
      );

    const matchesStatus =
      status === "All Movies" ||
      movie.status === status;

    const matchesRating = movie.customer_rating >= minRating;
    return (
      matchesSearch &&
      matchesGenre &&
      matchesStatus &&
      matchesRating
    );

  });


  // SORT MOVIES
  filteredMovies.sort((a, b) => {

    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }

   if (sortBy === "rating") {
    return b.customer_rating - a.customer_rating;
  
  }
    if (sortBy === "duration") {
      return a.duration - b.duration;
    }

    return 0;

  });


  // RESET FILTERS
  const resetFilters = () => {

    setSearch("");
    setSelectedGenre("All");
    setStatus("All Movies");
    setMinRating(0);
    setSortBy("title");

  };


  return (

    <div className="movies-page">

      {/* PAGE HEADING */}

      <div className="movies-heading">

        <div>

          <div className="breadcrumb">

            <Link to="/">Home</Link>

            <span>/</span>

            <span>Movies</span>

          </div>

          <h1>Movie Catalog</h1>

        </div>


        <div className="sort-section">

          <label>Sort by:</label>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >

            <option value="title">Title (A - Z)</option>

            <option value="rating">Highest Rating</option>

            <option value="duration">Duration</option>

          </select>

        </div>

      </div>


      {/* MAIN CONTENT */}

      <div className="movies-layout">


        {/* FILTER SIDEBAR */}

        <aside className="filter-sidebar">

          <div className="filter-heading">

            <h2>
              <FaSlidersH />
              Filters
            </h2>

            <button onClick={resetFilters}>
              Reset
            </button>

          </div>


          {/* SEARCH */}

          <div className="filter-group">

            <label>SEARCH</label>

            <div className="movie-search">

              <FaSearch />

              <input
                type="text"
                placeholder="Search movies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

            </div>

          </div>


          {/* STATUS */}

          <div className="filter-group">

            <label>STATUS</label>

            <div className="status-options">

              {[
                "All Movies",
                "Now Showing",
                "Coming Soon"
              ].map((item) => (

                <label key={item}>

                  <input
                    type="radio"
                    name="status"
                    checked={status === item}
                    onChange={() => setStatus(item)}
                  />

                  <span>
                    {item === "Now Showing"
                      ? "Now Showing In Theaters"
                      : item}
                  </span>

                </label>

              ))}

            </div>

          </div>


          {/* GENRES */}

          <div className="filter-group">

            <label>GENRE</label>

            <div className="genre-buttons">

              {genres.map((genre) => (

                <button
                  key={genre}
                  className={
                    selectedGenre === genre
                      ? "genre-active"
                      : ""
                  }
                  onClick={() => setSelectedGenre(genre)}
                >
                  {genre}
                </button>

              ))}

            </div>

          </div>


          {/* MINIMUM RATING */}

          <div className="filter-group rating-filter">

            <div className="rating-heading">

              <label>MINIMUM RATING</label>

              <span>
                {minRating === 0
                  ? "Any"
                  : minRating.toFixed(1)}
              </span>

            </div>

            <input
    type="range"
    min="0"
    max="5"
    step="0.5"
    value={minRating}
    onChange={(e) =>
        setMinRating(Number(e.target.value))
    }
/>

          </div>

        </aside>


        {/* MOVIE CARDS */}

        <main className="movies-content">

          {loading ? (

            <p className="movie-count">
              Loading movies...
            </p>

          ) : error ? (

            <div className="no-movies">

              <h2>Unable to Load Movies</h2>

              <p>{error}</p>

            </div>

          ) : (

            <>

              <p className="movie-count">
                Showing {filteredMovies.length} movies
              </p>


              <div className="movie-grid">

                {filteredMovies.length > 0 ? (

                  filteredMovies.map((movie) => (

                    <div
                      className="movie-card"
                      key={movie.id}
                    >

                      {/* POSTER */}

                      <div className="movie-poster">

                        <img
                          src={movie.poster || "https://placehold.co/600x850/111827/ffffff?text=Movie+Poster"}
                          alt={movie.title}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/600x850/111827/ffffff?text=Movie+Poster";
                          }}
                        />

                       <div className="movie-rating">

    <FaStar />

    {movie.customer_rating > 0
        ? movie.customer_rating.toFixed(1)
        : "No Ratings"}

</div>
                      </div>


                      {/* MOVIE DETAILS */}

                      <div className="movie-details">

                        <h2>{movie.title}</h2>
                        <p className="movie-review-count">

    {movie.total_reviews}{" "}

    {movie.total_reviews === 1
        ? "Customer Review"
        : "Customer Reviews"}

</p>


                        <p className="movie-genres">
                          {movie.genre.join(", ")}
                        </p>

                        <div className="movie-info">

                          <span>
                            <FaClock />
                            {movie.duration} mins
                          </span>

                          <span className="certificate">
                            {movie.certificate}
                          </span>

                        </div>


                        {/* MOVIE STATUS */}

                        <p className="movie-status">
                          {movie.status}
                        </p>


                        {/* BOOK BUTTON */}

                        <Link
                          to={`/movies/${movie.id}`}
                          className="book-button"
                        >

                          <FaTicketAlt />

                          {movie.status === "Coming Soon"
                            ? "View Details"
                            : "Book Tickets"}

                        </Link>

                      </div>

                    </div>

                  ))

                ) : (

                  <div className="no-movies">

                    <h2>No Movies Found</h2>

                    <p>
                      Try changing your search or filters.
                    </p>

                    <button onClick={resetFilters}>
                      Clear Filters
                    </button>

                  </div>

                )}

              </div>

            </>

          )}

        </main>

      </div>

    </div>

  );

}

export default Movies;
