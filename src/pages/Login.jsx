import { useState } from "react";
import API from "../services/api";
import "./Login.css";

function Login({ authMode, setAuthMode, handleLogin }) {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const data = {
      email: formData.get("email").trim().toLowerCase(),
      password: formData.get("password")
    };

    if (authMode === "signup") {

      data.name = formData.get("name").trim();
      data.phone = formData.get("phone").trim();

    }

    try {

      if (authMode === "signup") {

        const response = await API.post(
          "/auth/register.php",
          data
        );

        if (response.data.success) {

          alert("Account created successfully!");

          setAuthMode("signin");

        }

      } else {

        const response = await API.post(
          "/auth/login.php",
          data
        );

        if (response.data.success) {

          handleLogin(response.data.user);

        }

      }

    } catch (err) {

      setError(
        err.response?.data?.message ||
        "Unable to connect to the server."
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="auth-container">

      <div className="brand">

        <h1>
          🎬 CINE<span>VERSE</span>
        </h1>

        <p>Your gateway to the ultimate cinematic experience</p>

      </div>

      <div className="auth-card">

        <div className="auth-tabs">

          <button
            type="button"
            className={authMode === "signin" ? "selected" : ""}
            onClick={() => {
              setError("");
              setAuthMode("signin");
            }}
          >
            Sign In
          </button>

          <button
            type="button"
            className={authMode === "signup" ? "selected" : ""}
            onClick={() => {
              setError("");
              setAuthMode("signup");
            }}
          >
            Create Account
          </button>

        </div>

        <form onSubmit={handleSubmit}>

          {authMode === "signup" && (

            <div className="input-box">

              <label>Full Name *</label>

              <input
                type="text"
                name="name"
                placeholder="Alex Morgan"
                required
              />

            </div>

          )}

          <div className="input-box">

            <label>Email Address *</label>

            <input
              type="email"
              name="email"
              placeholder="alex@example.com"
              required
            />

          </div>

          {authMode === "signup" && (

            <div className="input-box">

              <label>Phone Number</label>

              <input
                type="tel"
                name="phone"
                placeholder="+94 77 123 4567"
              />

            </div>

          )}

          <div className="input-box">

            <label>
              Password *
              {authMode === "signup" && " (min. 6 characters)"}
            </label>

            <input
              type="password"
              name="password"
              placeholder="••••••••"
              minLength={authMode === "signup" ? 6 : undefined}
              required
            />

          </div>

          {error && (

            <p style={{ color: "#ed263f", marginBottom: "15px" }}>
              {error}
            </p>

          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >

            {loading
              ? "Please wait..."
              : authMode === "signup"
                ? "👤 Create Account"
                : "Sign In"}

          </button>

        </form>

        <div className="auth-footer">

          {authMode === "signup" ? (

            <p>
              Already have an account?{" "}

              <button
                type="button"
                onClick={() => setAuthMode("signin")}
              >
                Sign In
              </button>

            </p>

          ) : (

            <p>
              Don't have an account?{" "}

              <button
                type="button"
                onClick={() => setAuthMode("signup")}
              >
                Create Account
              </button>

            </p>

          )}

        </div>

      </div>

    </div>

  );

}

export default Login;