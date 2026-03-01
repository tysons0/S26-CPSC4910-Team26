import { Routes, Route, Link } from "react-router-dom";
import "./css/App.css";
import About from "./pages/About";
import Login from "./pages/Login";
import NavBar from "./components/NavBar";
import Organizations from "./pages/Organizations";
import Profile from "./pages/Profile";
import SignUp from "./pages/auth/DriverSignUp";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DriverDashboard from "./pages/driver/DriverDashboard";
import SponsorDashboard from "./pages/sponsor/SponsorDashboard";
import DriverSignUp from "./pages/auth/DriverSignUp";
import SponsorSignUp from "./pages/auth/SponsorSignUp";
import AdminSignUp from "./pages/auth/AdminSignUp";
import DriverProfile from "./pages/driver/DriverProfile";
import SponsorProfile from "./pages/sponsor/SponsorProfile";
import AdminProfile from "./pages/admin/AdminProfile";
import OrganizationCreate from "./pages/organization/OrganizationCreate";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<About />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/DriverSignUp" element={<DriverSignUp />} />
        <Route path="/Organizations" element={<Organizations />} />
        <Route path="/SignUp" element={<SignUp />} />

        {/* Protected Routes */}
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/DriverDashboard" element={<DriverDashboard />} />
        <Route path="/SponsorDashboard" element={<SponsorDashboard />} />
        <Route path="/SponsorSignUp" element={<SponsorSignUp />} />
        <Route path="/AdminSignUp" element={<AdminSignUp />} />
        <Route path="/DriverProfile" element={<DriverProfile />} />
        <Route path="/SponsorProfile" element={<SponsorProfile />} />
        <Route path="/AdminProfile" element={<AdminProfile />} />
        <Route path="/CreateOrganization" element={<OrganizationCreate />} />
      </Routes>
    </>
  );
}

export default App;
