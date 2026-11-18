import { useEffect, useState } from "react";

import {
    BrowserRouter,
    Routes,
    Route,
    useNavigate,
    Navigate,
    useLocation
} from "react-router-dom";

import Navbar from "./components/NavBar";
import SearchBar from "./components/SearchBar";
import Login from "./pages/Login";
import Footer from "./components/Footer";
import MobileQRScanner from "./pages/MobileQRScanner";
import Movies from "./pages/Movies";
import MyTickets from "./pages/MyTickets";
import AdminDashboard from "./pages/AdminDashboard";
import CinemaHallManagement from "./pages/CinemaHallManagement";

// Customer pages
import MovieDetails from "./pages/MovieDetails";
import Profile from "./pages/Profile";
import SeatSelection from "./pages/SeatSelection";
import BookingConfirmation from "./pages/BookingConfirmation";
import BookingHistory from "./pages/BookingHistory";
import Payment from "./pages/Payment";
import PaymentHistory from "./pages/PaymentHistory";
import Home from "./pages/Home";

import API from "./services/api";

import "./App.css";


// MAIN APPLICATION
function AppContent() {

    const [authMode, setAuthMode] = useState(null);
    const [checkingSession, setCheckingSession] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const isMobileScanner = location.pathname === "/mobile-scanner";
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


                {!isMobileScanner && !(isLoggedIn && user?.role === "admin") && (
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


                    {/* HOME */}

                    <Route
                        path="/"
                        element={<Home />}
                    />


                    {/* MOVIES */}

                    <Route
                        path="/movies"
                        element={<Movies />}
                    />


                    {/* MOVIE DETAILS */}

                    <Route
                        path="/movies/:id"
                        element={<MovieDetails />}
                    />


                    {/* CUSTOMER PROFILE */}

                    <Route
                        path="/profile"
                        element={
                            isLoggedIn
                                ? <Profile />
                                : <Navigate to="/" replace />
                        }
                    />


                    {/* SEAT SELECTION */}

                    <Route
                        path="/seats/:showtimeId"
                        element={
                            isLoggedIn
                                ? <SeatSelection />
                                : <Navigate to="/" replace />
                        }
                    />


                    {/* BOOKING CONFIRMATION */}

                    <Route
                        path="/booking/confirm"
                        element={
                            isLoggedIn
                                ? <BookingConfirmation />
                                : <Navigate to="/" replace />
                        }
                    />


                    {/* CUSTOMER BOOKING HISTORY */}

                    <Route
                        path="/booking-history"
                        element={
                            isLoggedIn
                                ? <BookingHistory />
                                : <Navigate to="/" replace />
                        }
                    />


                    {/* PAYMENT */}

                    <Route
                        path="/payment"
                        element={
                            isLoggedIn
                                ? <Payment />
                                : <Navigate to="/" replace />
                        }
                    />


                    {/* CUSTOMER PAYMENT HISTORY */}

                    <Route
                        path="/payment-history"
                        element={
                            isLoggedIn
                                ? <PaymentHistory />
                                : <Navigate to="/" replace />
                        }
                    />


                    {/* EXISTING TICKETS PAGE */}

                    <Route
                        path="/tickets"
                        element={
                            <MyTickets
                                setAuthMode={setAuthMode}
                            />
                        }
                    />


                    {/* ADMIN DASHBOARD */}

                    <Route
                        path="/admin"
                        element={
                            isLoggedIn && user?.role === "admin"
                                ? <AdminDashboard />
                                : <Navigate to="/" replace />
                        }
                    />


                    {/* ADMIN CINEMA HALL MANAGEMENT */}

                    <Route
                        path="/admin/cinema-halls"
                        element={
                            isLoggedIn && user?.role === "admin"
                                ? <CinemaHallManagement />
                                : <Navigate to="/" replace />
                        }
                    />
                    <Route
                        path="/mobile-scanner"
                        element={<MobileQRScanner />}
                    />

                </Routes>

            )}


            {/* FOOTER */}

           {!isMobileScanner && <Footer />}

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