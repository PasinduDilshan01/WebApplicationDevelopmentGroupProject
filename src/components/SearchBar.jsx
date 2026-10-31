import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import "./SearchBar.css";
function SearchBar() {
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");

  const genres = ["All Genres","Action","Sci-Fi","Thriller", "Animation","romance", "Horror" ];

  return (

<div className="search-container">

  {/* SEARCH INPUT */}

  <div className="search-input-box">

    <div className="search-icon">
      <FaSearch />
    </div>

    <input
      type="text"
      placeholder="Search movies by title, director, or actor..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />

  </div>


  {/* GENRE BUTTONS */}

  <div className="genre-container">

    {genres.map((genre) => (

      <button
        key={genre}
        className={`genre-button ${
          selectedGenre === genre ? "active" : ""
        }`}
        onClick={() => setSelectedGenre(genre)}
      >

        {genre}

      </button>

    ))}

  </div>

</div>

);
}

export default SearchBar;