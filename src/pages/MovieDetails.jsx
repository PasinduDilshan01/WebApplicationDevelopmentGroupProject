import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import {
    FaClock,
    FaCalendarAlt,
    FaStar,
    FaTicketAlt
} from "react-icons/fa";

import API from "../services/api";
import getPosterUrl from "../services/poster";

import "./MovieDetails.css";

function MovieDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [movie, setMovie] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [reviews, setReviews] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedRating, setSelectedRating] = useState(0);
    const [comment, setComment] = useState("");

    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewMessage, setReviewMessage] = useState("");
    const [reviewError, setReviewError] = useState("");

    // FETCH REVIEWS
    const fetchReviews = async () => {
        try {
            const response = await API.get(
                `/reviews/by_movie.php?movie_id=${id}`
            );

            if (response.data.success) {
                setReviews(response.data.reviews || []);
            }
        } catch (err) {
            console.error("Error loading reviews:", err);
        }
    };

    // FETCH MOVIE DETAILS, SHOWTIMES AND REVIEWS
    useEffect(() => {
        const fetchMovieDetails = async () => {
            try {
                setLoading(true);
                setError("");

                const [
                    movieResponse,
                    showtimeResponse,
                    reviewResponse
                ] = await Promise.all([
                    API.get(`/movies/details.php?id=${id}`),
                    API.get(`/showtimes/by_movie.php?movie_id=${id}`),
                    API.get(`/reviews/by_movie.php?movie_id=${id}`)
                ]);

                // MOVIE DETAILS
                if (movieResponse.data.success) {
                    const movieData = movieResponse.data.movie;

                    let genres =
                        movieData.genres ||
                        movieData.genre ||
                        "";

                    if (!Array.isArray(genres)) {
                        genres = genres
                            ? genres.split(",").map(item => item.trim())
                            : [];
                    }

                    setMovie({
                        ...movieData,
                        genres
                    });
                } else {
                    setError("Movie details could not be found.");
                }

                // SHOWTIMES
                if (showtimeResponse.data.success) {
                    setShowtimes(
                        showtimeResponse.data.showtimes || []
                    );
                }

                // REVIEWS
                if (reviewResponse.data.success) {
                    setReviews(
                        reviewResponse.data.reviews || []
                    );
                }

            } catch (err) {
                console.error("Error loading movie details:", err);

                setError(
                    err.response?.data?.message ||
                    "Unable to load movie details."
                );

            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMovieDetails();
        }

    }, [id]);

    // SUBMIT REVIEW
    const handleReviewSubmit = async (e) => {
        e.preventDefault();

        setReviewMessage("");
        setReviewError("");

        if (selectedRating === 0) {
            setReviewError("Please select a star rating.");
            return;
        }

        if (!comment.trim()) {
            setReviewError("Please enter your review.");
            return;
        }

        try {
            setReviewLoading(true);

            const response = await API.post(
                "/reviews/create.php",
                {
                    movie_id: Number(id),
                    rating: selectedRating,
                    comment: comment.trim()
                }
            );

            if (response.data.success) {
                setReviewMessage(response.data.message);

                setSelectedRating(0);
                setComment("");

                await fetchReviews();

            } else {
                setReviewError(
                    response.data.message ||
                    "Failed to submit review."
                );
            }

        } catch (err) {
            if (err.response?.status === 401) {
                setReviewError("Please log in to submit a review.");
            } else {
                setReviewError(
                    err.response?.data?.message ||
                    "Unable to submit your review."
                );
            }

        } finally {
            setReviewLoading(false);
        }
    };

    // CALCULATE CUSTOMER REVIEW AVERAGE
    const averageReviewRating = reviews.length > 0
        ? (
            reviews.reduce(
                (total, review) => total + Number(review.rating),
                0
            ) / reviews.length
        ).toFixed(1)
        : "N/A";

    // LOADING
    if (loading) {
        return (
            <div className="movie-details-message">
                Loading movie details...
            </div>
        );
    }

    // ERROR
    if (error || !movie) {
        return (
            <div className="movie-details-message">
                {error || "Movie not found."}
            </div>
        );
    }

    return (
        <div className="movie-details-page">

            {/* MOVIE INFORMATION */}
            <section className="movie-details-container">

                {/* MOVIE POSTER */}
                <div className="movie-details-poster">

                    <img
                        src={
                            getPosterUrl(movie.poster) ||
                            "https://placehold.co/600x850/111827/ffffff?text=Movie+Poster"
                        }
                        alt={`${movie.title} poster`}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                                "https://placehold.co/600x850/111827/ffffff?text=Movie+Poster";
                        }}
                    />

                </div>

                {/* MOVIE DETAILS */}
                <div className="movie-details-content">

                    <span className="movie-details-status">
                        {movie.status}
                    </span>

                    <h1>{movie.title}</h1>

                    <p className="movie-details-director">
                        Directed by {movie.director || "Not available"}
                    </p>

                    {/* CUSTOMER REVIEW RATING */}
                    <div className="movie-details-rating">

                        <FaStar />

                        <span>
                            {reviews.length > 0
                                ? averageReviewRating
                                : "No Ratings"}
                        </span>

                        <small>
                            ({reviews.length} Customer Reviews)
                        </small>

                    </div>

                    {/* MOVIE INFORMATION */}
                    <div className="movie-details-meta">

                        <p>
                            <FaCalendarAlt />
                            {movie.release_date || "Release date unavailable"}
                        </p>

                        <p>
                            <FaClock />
                            {movie.duration
                                ? `${movie.duration} minutes`
                                : "Duration unavailable"}
                        </p>

                        <p>
                            Certificate: {movie.certificate || "Not specified"}
                        </p>

                    </div>

                    {/* GENRES */}
                    <div className="movie-details-genres">

                        {movie.genres.map((genre, index) => (
                            <span key={index}>
                                {genre}
                            </span>
                        ))}

                    </div>

                    {/* DESCRIPTION */}
                    <div className="movie-details-description">

                        <h3>About This Movie</h3>

                        <p>
                            {movie.description ||
                                "Movie description unavailable."}
                        </p>

                    </div>

                </div>

            </section>

            {/* SHOWTIME SELECTION */}
            <section className="movie-showtimes-section">

                <h2>Available Showtimes</h2>

                {showtimes.length === 0 ? (

                    <p className="no-showtimes">
                        No showtimes are currently available for this movie.
                    </p>

                ) : (

                    <div className="movie-showtimes-grid">

                        {showtimes.map((showtime) => (

                            <div
                                className="movie-showtime-card"
                                key={showtime.id}
                            >

                                <h3>{showtime.hall}</h3>

                                <p>
                                    <FaCalendarAlt />
                                    {showtime.show_date}
                                </p>

                                <p>
                                    <FaClock />
                                    {showtime.show_time}
                                </p>

                                <h4>
                                    Rs. {Number(showtime.ticket_price).toFixed(2)}
                                </h4>

                                {movie.status === "Now Showing" ? (

                                    <Link
                                        to={`/seats/${showtime.id}`}
                                        className="movie-book-ticket-button"
                                    >
                                        <FaTicketAlt />
                                        Book Tickets
                                    </Link>

                                ) : (

                                    <button
                                        className="movie-book-ticket-button"
                                        disabled
                                    >
                                        Coming Soon
                                    </button>

                                )}

                            </div>

                        ))}

                    </div>

                )}

            </section>

            {/* CUSTOMER REVIEWS */}
            <section className="movie-reviews-section">

                <h2>Customer Reviews</h2>

                {/* REVIEW SUMMARY */}
                <div className="review-summary">

                    <FaStar />

                    <strong>{averageReviewRating}</strong>

                    <span>
                        {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
                    </span>

                </div>

                {/* REVIEW FORM */}
                <div className="review-form-container">

                    <h3>Write Your Review</h3>

                    <form onSubmit={handleReviewSubmit}>

                        <label>Your Rating</label>

                        <div className="review-star-selection">

                            {[1, 2, 3, 4, 5].map((star) => (

                                <FaStar
                                    key={star}
                                    className={
                                        star <= selectedRating
                                            ? "review-star selected"
                                            : "review-star"
                                    }
                                    onClick={() => setSelectedRating(star)}
                                />

                            ))}

                        </div>

                        <label htmlFor="review-comment">
                            Your Comment
                        </label>

                        <textarea
                            id="review-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your thoughts about this movie..."
                            rows="4"
                        />

                        {reviewError && (

                            <p className="review-error">

                                {reviewError}

                                {reviewError.includes("log in") && (
                                    <>
                                        {" "}
                                        <button
                                            type="button"
                                            className="review-login-link"
                                            onClick={() => navigate("/login")}
                                        >
                                            Log In
                                        </button>
                                    </>
                                )}

                            </p>

                        )}

                        {reviewMessage && (
                            <p className="review-success">
                                {reviewMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="submit-review-button"
                            disabled={reviewLoading}
                        >
                            {reviewLoading
                                ? "Submitting..."
                                : "Submit Review"}
                        </button>

                    </form>

                </div>

                {/* DISPLAY REVIEWS */}
                <div className="customer-reviews-list">

                    {reviews.length === 0 ? (

                        <p className="no-reviews">
                            No reviews yet. Be the first to review this movie!
                        </p>

                    ) : (

                        reviews.map((review) => (

                            <div
                                className="customer-review-card"
                                key={review.id}
                            >

                                <div className="customer-review-header">

                                    <h4>{review.customer}</h4>

                                    <span>
                                        {review.created_at}
                                    </span>

                                </div>

                                <div className="customer-review-stars">

                                    {[1, 2, 3, 4, 5].map((star) => (

                                        <FaStar
                                            key={star}
                                            className={
                                                star <= Number(review.rating)
                                                    ? "review-star selected"
                                                    : "review-star"
                                            }
                                        />

                                    ))}

                                </div>

                                <p>{review.comment}</p>

                            </div>

                        ))

                    )}

                </div>

            </section>

        </div>
    );
}

export default MovieDetails;