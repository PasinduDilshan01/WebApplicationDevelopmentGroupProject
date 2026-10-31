import "./Login.css";

function Login({ authMode, setAuthMode, handleLogin }) {
  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const password = formData.get("password")?.toString();

    if (authMode === "signup") {
      alert("Account Created Successfully!");
      setAuthMode("signin");
      return;
    }

    if (
      email === "admin@cineverse.demo" &&
      password === "Admin123!"
    ) {
      handleLogin({
        name: "Admin",
        email,
        role: "admin",
      });
      return;
    }

    if (
      email === "demo@cineverse.demo" &&
      password === "Demo123!"
    ) {
      handleLogin({
        name: "Demo User",
        email,
        role: "user",
      });
      return;
    }

    alert("Invalid demo email or password.");
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
            onClick={() => setAuthMode("signin")}
          >
            Sign In
          </button>

          <button
            type="button"
            className={authMode === "signup" ? "selected" : ""}
            onClick={() => setAuthMode("signup")}
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
                placeholder="+1(555)000-0000"
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

          {authMode === "signin" && (
            <div className="forgot-password">
              <a href="#">Forgot Password?</a>
            </div>
          )}

          <button type="submit" className="auth-submit">
            {authMode === "signup" ? "👤 Create Account" : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          {authMode === "signup" ? (
            <p>
              Already have an account?{" "}
              <button type="button" onClick={() => setAuthMode("signin")}>
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{" "}
              <button type="button" onClick={() => setAuthMode("signup")}>
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