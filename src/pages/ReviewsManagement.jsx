import { useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaSyncAlt,
  FaStar,
  FaTrash,
} from "react-icons/fa";
import API from "../services/api";
import "./ReviewsManagement.css";

function ReviewsManagement() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch reviews from database
  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/reviews/list.php");

      if (response.data.success) {
        setReviews(response.data.reviews);
      } else {
        setError(response.data.message || "Failed to load reviews.");
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);

      setError(
        err.response?.data?.message || "Unable to load reviews."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load reviews when page opens
  useEffect(() => {
    fetchReviews();
  }, []);

  // Search reviews
  const filteredReviews = useMemo(() => {
    const searchText = search.toLowerCase();

    return reviews.filter((review) =>
      [
        String(review.id),
        review.customer || "",
        review.email || "",
        review.movie || "",
        review.comment || "",
      ].some((value) => value.toLowerCase().includes(searchText))
    );
  }, [reviews, search]);

  // Refresh reviews
  const handleRefresh = () => {
    fetchReviews();
  };

  const handleDeleteReview = async (review) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete review REV-${review.id}? This action cannot be undone.`
  );

  if (!confirmed) return;

  try {
    const response = await API.delete("/reviews/delete.php", {
      data: {
        id: review.id,
      },
    });

    if (response.data.success) {
      alert("Review deleted successfully.");
      fetchReviews();
    } else {
      alert(response.data.message || "Failed to delete review.");
    }
  } catch (err) {
    console.error("Delete review error:", err);

    alert(
      err.response?.data?.message || "Unable to delete review."
    );
  }
};

  return (
    <div className="reviews-management">

      <div className="reviews-header">
        <div>
          <h2>Reviews Management</h2>
          <p>Manage customer reviews and ratings.</p>
        </div>

        <button
          className="reviews-refresh-button"
          onClick={handleRefresh}
        >
          <FaSyncAlt /> Refresh
        </button>
      </div>

      <div className="reviews-toolbar">
        <div className="reviews-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p>Loading reviews...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="reviews-table-container">

          <table className="reviews-table">

            <thead>
              <tr>
                <th>Review ID</th>
                <th>Customer</th>
                <th>Movie</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <tr key={review.id}>

                    <td>REV-{review.id}</td>

                    <td>
                      <div>{review.customer}</div>
                      <small>{review.email}</small>
                    </td>

                    <td>{review.movie}</td>

                    <td>
                      <span className="review-rating">
                        <FaStar />
                        {review.rating}/5
                      </span>
                    </td>

                    <td>{review.comment || "No comment"}</td>

                    <td>
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>
                      <button
                        className="review-delete-button"
                        title="Delete review"
                        onClick={() => handleDeleteReview(review)}
                        >
                        <FaTrash />
                        </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="reviews-empty">
                    No reviews available.
                  </td>
                </tr>
              )}
            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default ReviewsManagement;