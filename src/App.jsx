import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate
} from "react-router-dom";

import Navbar from "./components/NavBar";
import SearchBar from "./components/SearchBar";
import Login from "./pages/Login";
import Footer from "./components/Footer";
import Movies from "./pages/Movies";
import MyTickets from "./pages/MyTickets";
import AdminDashboard from "./pages/AdminDashboard";
import CinemaHallManagement from "./pages/CinemaHallManagement";
import { FaCirclePlay, FaArrowRight } from "react-icons/fa6";

import API from "./services/api";
import "./App.css";


// HOME PAGE
function Home() {
  return (
    <div className="home-page">

      <SearchBar />

      <br />

      <button className="theater-btn">
        <FaCirclePlay /> IN THEATERS
      </button>

      <div className="now-showing">

        <h3>Now Showing</h3>

        <button className="view-all-btn">
          View All <FaArrowRight />
        </button>

      </div>

    </div>
  );
}


// MAIN APPLICATION
function AppContent() {

  const [authMode, setAuthMode] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();


  // CHECK PHP SESSION WHEN APP LOADS
  useEffect(() => {

    const checkSession = async () => {

      try {

        const response = await API.get("/auth/profile.php");

        if (response.data.success) {
          setUser(response.data.user);
          setIsLoggedIn(true);
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }

      } catch (error) {

        console.error("Session check:", error);

        setUser(null);
        setIsLoggedIn(false);

      } finally {

        setCheckingSession(false);

      }

    };

    checkSession();

  }, []);


  // LOGIN SUCCESS
  const handleLogin = (loggedInUser) => {

    setUser(loggedInUser);
    setIsLoggedIn(true);
    setAuthMode(null);

    if (loggedInUser.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }

  };


  // LOGOUT
  const handleLogout = async () => {

    try {

      await API.post("/auth/logout.php");

    } catch (error) {

      console.error("Logout error:", error);

    } finally {

      setUser(null);
      setIsLoggedIn(false);
      setAuthMode(null);

      navigate("/");

    }

  };


  // WAIT UNTIL SESSION CHECK IS COMPLETE
  if (checkingSession) {
    return <div>Loading CINEVERSE...</div>;
  }


  return (

    <div className="app">

      {/* NAVBAR */}
      {!(isLoggedIn && user?.role === "admin") && (

        <Navbar
          setAuthMode={setAuthMode}
          isLoggedIn={isLoggedIn}
          user={user}
          handleLogout={handleLogout}
        />

      )}


      {/* LOGIN / SIGNUP */}
      {authMode !== null ? (

        <Login
          authMode={authMode}
          setAuthMode={setAuthMode}
          handleLogin={handleLogin}
        />

      ) : (

        /* APPLICATION ROUTES */
        <Routes>

          <Route
            path="/admin"
            element={
              isLoggedIn && user?.role === "admin"
                ? <AdminDashboard />
                : <Navigate to="/" replace />
            }
          />

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/movies"
            element={<Movies />}
          />

          <Route
            path="/tickets"
            element={
              <MyTickets
                setAuthMode={setAuthMode}
              />
            }
          />
          <Route
            path="/admin/cinema-halls"
            element={
              isLoggedIn && user?.role === "admin"
              ? <CinemaHallManagement />
              : <Navigate to="/" replace />
            }
          />

        </Routes>

      )}


      {/* FOOTER */}
      <Footer />

    </div>

  );

}


// ROOT APPLICATION
function App() {

  return (

    <BrowserRouter>
      <AppContent />
    </BrowserRouter>

  );

}

export default App;
