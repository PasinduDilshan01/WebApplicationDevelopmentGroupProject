import { useState } from "react";
import { FaSlidersH,FaSearch,FaStar,FaClock,FaTicketAlt} from "react-icons/fa";
import { Link } from "react-router-dom";

import "./Movies.css";


function Movies() {

  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [status, setStatus] = useState("All Movies");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("title");

  // MOVIE DATA

  const movies = [
    {
      id: 1,
      title: "Cosmic Odyssey: Nova",
      genre: ["Sci-Fi", "Adventure"],
      rating: 9.4,
      duration: 145,
      certificate: "PG-13",
      status: "Now Showing",
      poster: "/posters/cosmic.jpg"
    },
    {
      id: 2,
      title: "Cyber Horizon 2099",
      genre: ["Sci-Fi", "Thriller"],
      rating: 9.1,
      duration: 138,
      certificate: "PG-13",
      status: "Now Showing",
      poster: "/posters/cyber.jpg"
    },
    {
      id: 3,
      title: "Kingdom of the Immortals",
      genre: ["Fantasy", "Adventure"],
      rating: 8.8,
      duration: 152,
      certificate: "PG-13",
      status: "Now Showing",
      poster: "/posters/kingdom.jpg"
    },
    {
      id: 4,
      title: "The Dragon Kingdom",
      genre: ["Animation", "Fantasy", "Family"],
      rating: 8.7,
      duration: 106,
      certificate: "PG",
      status: "Now Showing",
      poster: "/posters/dragon.jpg"
    },
    {
      id: 5,
      title: "Velocity: Redline",
      genre: ["Action", "Crime", "Thriller"],
      rating: 8.3,
      duration: 132,
      certificate: "PG-13",
      status: "Now Showing",
      poster: "/posters/velocity.jpg"
    },
    {
      id: 6,
      title: "Shadow Protocol",
      genre: ["Action", "Thriller"],
      rating: 8.5,
      duration: 125,
      certificate: "PG-13",
      status: "Coming Soon",
      poster: "/posters/shadow.jpg"
    },
    {
      id: 7,
      title: "Love Beyond Stars",
      genre: ["Romance", "Drama"],
      rating: 8.2,
      duration: 118,
      certificate: "PG",
      status: "Coming Soon",
      poster: "/posters/love.jpg"
    },
    {
      id: 8,
      title: "The Last Mystery",
      genre: ["Mystery", "Crime"],
      rating: 8.9,
      duration: 140,
      certificate: "PG-13",
      status: "Now Showing",
      poster: "/posters/mystery.jpg"
    }
  ];

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
      movie.genre.includes(selectedGenre);

    const matchesStatus =
      status === "All Movies" ||
      movie.status === status;

    const matchesRating = movie.rating >= minRating;

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
      return b.rating - a.rating;
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
                    selectedGenre === genre ? "genre-active" : ""
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
                {minRating === 0 ? "Any" : minRating.toFixed(1)}
              </span>

            </div>

            <input
              type="range"
              min="0"
              max="10"
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

          <p className="movie-count">
            Showing {filteredMovies.length} movies
          </p>


          <div className="movie-grid">

            {filteredMovies.length > 0 ? (

              filteredMovies.map((movie) => (

                <div className="movie-card" key={movie.id}>

                  {/* POSTER */}

                  <div className="movie-poster">

                    <img
                      src={movie.poster}
                      alt={movie.title}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://placehold.co/600x850/111827/ffffff?text=Movie+Poster";
                      }}
                    />

                    <div className="movie-rating">

                      <FaStar />

                      {movie.rating}

                    </div>

                  </div>


                  {/* MOVIE DETAILS */}

                  <div className="movie-details">

                    <h2>{movie.title}</h2>

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


                    {/* BOOK BUTTON */}

                    <button className="book-button">

                      <FaTicketAlt />

                      Book Tickets

                    </button>

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

        </main>

      </div>

    </div>

  );

}

export default Movies;