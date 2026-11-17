import { useEffect, useState } from "react";

import { useParams, Link, useNavigate } from "react-router-dom";

import {
    FaClock,
    FaCalendarAlt,
    FaStar,
    FaTicketAlt
} from "react-icons/fa";

import API from "../services/api";

import "./MovieDetails.css";


function MovieDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    // MOVIE INFORMATION
    const [movie, setMovie] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [reviews, setReviews] = useState([]);

    // LOADING AND ERROR
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // NEW REVIEW
    const [selectedRating, setSelectedRating] = useState(0);
    const [comment, setComment] = useState("");

    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewMessage, setReviewMessage] = useState("");
    const [reviewError, setReviewError] = useState("");

    // EDIT REVIEW
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editRating, setEditRating] = useState(0);
    const [editComment, setEditComment] = useState("");
    const [editLoading, setEditLoading] = useState(false);

    // DELETE REVIEW
    const [deletingReviewId, setDeletingReviewId] = useState(null);


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


    // CHECK CUSTOMER'S EXISTING REVIEW
    const myReview = reviews.find(
        review => review.is_mine === true
    );


    // SUBMIT NEW REVIEW
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


    // START EDITING REVIEW
    const handleEditClick = (review) => {

        setEditingReviewId(review.id);
        setEditRating(Number(review.rating));
        setEditComment(review.comment);

        setReviewMessage("");
        setReviewError("");

    };


    // CANCEL EDITING
    const handleCancelEdit = () => {

        setEditingReviewId(null);
        setEditRating(0);
        setEditComment("");

    };


    // UPDATE REVIEW
    const handleUpdateReview = async (e) => {

        e.preventDefault();

        setReviewMessage("");
        setReviewError("");

        if (editRating < 1 || editRating > 5) {

            setReviewError("Please select a star rating.");
            return;

        }

        if (!editComment.trim()) {

            setReviewError("Please enter your review.");
            return;

        }

        try {

            setEditLoading(true);

            const response = await API.put(
                "/reviews/update.php",
                {
                    review_id: editingReviewId,
                    rating: editRating,
                    comment: editComment.trim()
                }
            );

            if (response.data.success) {

                setReviewMessage(response.data.message);

                handleCancelEdit();

                await fetchReviews();

            } else {

                setReviewError(
                    response.data.message ||
                    "Unable to update your review."
                );

            }

        } catch (err) {

            setReviewError(
                err.response?.data?.message ||
                "Failed to update your review."
            );

        } finally {

            setEditLoading(false);

        }

    };


    // DELETE REVIEW
    const handleDeleteReview = async (reviewId) => {

        const confirmed = window.confirm(
            "Are you sure you want to delete your review? This action cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        setReviewMessage("");
        setReviewError("");

        try {

            setDeletingReviewId(reviewId);

            const response = await API.delete(
                "/reviews/delete.php",
                {
                    data: {
                        review_id: reviewId
                    }
                }
            );

            if (response.data.success) {

                setReviewMessage(response.data.message);

                // Clear editing form if this review was being edited
                if (editingReviewId === reviewId) {
                    handleCancelEdit();
                }

                // Refresh reviews and customer rating
                await fetchReviews();

            } else {

                setReviewError(
                    response.data.message ||
                    "Unable to delete your review."
                );

            }

        } catch (err) {

            if (err.response?.status === 401) {

                setReviewError(
                    "Please log in to delete your review."
                );

            } else {

                setReviewError(
                    err.response?.data?.message ||
                    "Failed to delete your review."
                );

            }

        } finally {

            setDeletingReviewId(null);

        }

    };


    // CALCULATE CUSTOMER REVIEW AVERAGE
    const averageReviewRating = reviews.length > 0

        ? (

            reviews.reduce(
                (total, review) =>
                    total + Number(review.rating),
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


                {/* POSTER */}

                <div className="movie-details-poster">

                    <img
                        src={
                            movie.poster ||
                            "https://placehold.co/600x850/111827/ffffff?text=Movie+Poster"
                        }
                        alt={movie.title}
                        onError={(e) => {

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


                    {/* CUSTOMER RATING */}

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
                        {reviews.length}{" "}
                        {reviews.length === 1 ? "Review" : "Reviews"}
                    </span>

                </div>


                {/* REVIEW FORM */}

                <div className="review-form-container">

                    {myReview ? (

                        <>
                            <h3>You Have Already Reviewed This Movie</h3>

                            <p>
                                You can edit or delete your existing review below.
                            </p>
                        </>

                    ) : (

                        <>

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

                        </>

                    )}


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


                                {/* REVIEW HEADER */}

                                <div className="customer-review-header">

                                    <h4>{review.customer}</h4>

                                    <span>
                                        {review.created_at}
                                    </span>

                                </div>


                                {/* REVIEW STARS */}

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


                                {/* REVIEW COMMENT */}

                                <p>{review.comment}</p>


                                {/* CUSTOMER ACTIONS */}

                                {review.is_mine && (

                                    <div className="review-action-buttons">

                                        <button
                                            type="button"
                                            className="edit-review-button"
                                            onClick={() => handleEditClick(review)}
                                        >
                                            Edit My Review
                                        </button>


                                        <button
                                            type="button"
                                            className="delete-review-button"
                                            onClick={() => handleDeleteReview(review.id)}
                                            disabled={deletingReviewId === review.id}
                                        >
                                            {deletingReviewId === review.id
                                                ? "Deleting..."
                                                : "Delete My Review"}
                                        </button>

                                    </div>

                                )}


                                {/* EDIT REVIEW FORM */}

                                {editingReviewId === review.id && (

                                    <form
                                        className="edit-review-form"
                                        onSubmit={handleUpdateReview}
                                    >

                                        <h4>Edit Your Review</h4>

                                        <label>Update Rating</label>

                                        <div className="review-star-selection">

                                            {[1, 2, 3, 4, 5].map((star) => (

                                                <FaStar
                                                    key={star}
                                                    className={
                                                        star <= editRating
                                                            ? "review-star selected"
                                                            : "review-star"
                                                    }
                                                    onClick={() => setEditRating(star)}
                                                />

                                            ))}

                                        </div>

                                        <label>Update Comment</label>

                                        <textarea
                                            value={editComment}
                                            onChange={(e) => setEditComment(e.target.value)}
                                            rows="4"
                                        />

                                        {reviewError && (
                                            <p className="review-error">
                                                {reviewError}
                                            </p>
                                        )}

                                        <div className="edit-review-actions">

                                            <button
                                                type="submit"
                                                className="submit-review-button"
                                                disabled={editLoading}
                                            >
                                                {editLoading
                                                    ? "Saving..."
                                                    : "Save Changes"}
                                            </button>

                                            <button
                                                type="button"
                                                className="cancel-edit-button"
                                                onClick={handleCancelEdit}
                                            >
                                                Cancel
                                            </button>

                                        </div>

                                    </form>

                                )}

                            </div>

                        ))

                    )}

                </div>

            </section>

        </div>

    );

}

export default MovieDetails;