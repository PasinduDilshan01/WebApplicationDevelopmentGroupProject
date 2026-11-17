import { useEffect, useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";

import API from "../services/api";
import "./Profile.css";

function Profile() {
  const [profile, setProfile] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Fetch customer profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/auth/profile.php");

      if (response.data.success) {
        const user = response.data.user;

        setProfile({
          id: user.id,
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
        });

        setFormData({
          name: user.name || "",
          phone: user.phone || "",
        });
      } else {
        setError(
          response.data.message || "Unable to load profile."
        );
      }
    } catch (err) {
      console.error("Profile loading error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load your profile. Please log in again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Enable editing
  const handleEdit = () => {
    setFormData({
      name: profile.name,
      phone: profile.phone,
    });

    setEditing(true);
    setError("");
    setMessage("");
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData({
      name: profile.name,
      phone: profile.phone,
    });

    setEditing(false);
    setError("");
  };

  // Update customer profile
  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await API.put(
        "/auth/update_profile.php",
        {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
        }
      );

      if (response.data.success) {
        setProfile((current) => ({
          ...current,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
        }));

        setEditing(false);
        setMessage("Profile updated successfully.");
      } else {
        setError(
          response.data.message || "Profile update failed."
        );
      }
    } catch (err) {
      console.error("Profile update error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-message">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="profile-page">

      <div className="profile-container">

        <div className="profile-header">
          <div className="profile-avatar">
            <FaUser />
          </div>

          <h2>My Profile</h2>

          <p>View and manage your account information.</p>
        </div>

        {error && (
          <div className="profile-error">
            {error}
          </div>
        )}

        {message && (
          <div className="profile-success">
            {message}
          </div>
        )}

        <form onSubmit={handleSave}>

          <div className="profile-field">
            <label>
              <FaUser /> Full Name
            </label>

            {editing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            ) : (
              <div className="profile-value">
                {profile.name}
              </div>
            )}
          </div>

          <div className="profile-field">
            <label>
              <FaEnvelope /> Email Address
            </label>

            <div className="profile-value">
              {profile.email}
            </div>
          </div>

          <div className="profile-field">
            <label>
              <FaPhone /> Phone Number
            </label>

            {editing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            ) : (
              <div className="profile-value">
                {profile.phone || "Not provided"}
              </div>
            )}
          </div>

          <div className="profile-actions">

            {editing ? (
              <>
                <button
                  type="submit"
                  className="profile-save-button"
                  disabled={saving}
                >
                  <FaSave />
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <FaTimes />
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                className="profile-edit-button"
                onClick={handleEdit}
              >
                <FaEdit />
                Edit Profile
              </button>
            )}

          </div>

        </form>

      </div>

    </div>
  );
}

export default Profile;