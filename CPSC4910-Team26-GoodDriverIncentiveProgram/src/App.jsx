import { Routes, Route, Link } from "react-router-dom";
import "./css/App.css";
import About from "./pages/About";
import Login from "./pages/Login";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import Sponsors from "./pages/Sponsors";
import Profile from "./pages/Profile";
import SignUp from "./pages/auth/DriverSignUp";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DriverDashboard from "./pages/driver/DriverDashboard";
import SponsorDashboard from "./pages/sponsor/SponsorDashboard";
import DriverSignUp from "./pages/auth/DriverSignUp";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<About />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/DriverSignUp" element={<DriverSignUp />} />
        <Route path="/Sponsors" element={<Sponsors />} />

        {/* Protected Routes */}
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/DriverDashboard" element={<DriverDashboard />} />
        <Route path="/SponsorDashboard" element={<SponsorDashboard />} />

        <Route path="/Profile" element={<Profile />} />
        <Route path="/SignUp" element={<SignUp />} />
      </Routes>
    </>
  );
}

export default App;
