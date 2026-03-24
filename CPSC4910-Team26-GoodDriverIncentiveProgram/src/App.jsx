import { Routes, Route, Link } from "react-router-dom";
import "./css/App.css";
import About from "./pages/About";
import Login from "./pages/Login";
import NavBar from "./components/NavBar";
import Organizations from "./pages/organization/Organizations";
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
import ForgotPassword from "./pages/email/ForgotPassword";
import ResetPassword from "./pages/email/ResetPassword";
import SponsorApplications from "./pages/sponsor/SponsorApplications";
import AdminApplications from "./pages/admin/AdminApplications";
import DriverWishlist from "./pages/driver/DriverWishlist";
import SponsorViewDrivers from "./pages/sponsor/SponsorViewDrivers";
import AdminViewDrivers from "./pages/admin/AdminViewDrivers";
import DriverPointHistory from "./pages/driver/DriverPointHistory";
import EbayTestDashboard from "./pages/sponsor/EbayTestDashboard";

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
        <Route path="/SponsorSignUp" element={<SponsorSignUp />} />
        <Route path="/AdminSignUp" element={<AdminSignUp />} />
        <Route path="/AdminProfile" element={<AdminProfile />} />
        <Route path="/CreateOrganization" element={<OrganizationCreate />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/Organizations" element={<Organizations />} />

        {/* Role Specific Routes */}

        {/* Driver Routes */}
        <Route path="/DriverDashboard" element={<DriverDashboard />} />
        <Route path="/DriverProfile" element={<DriverProfile />} />
        <Route path="/DriverWishlist" element={<DriverWishlist />} />
        <Route path="/DriverPointHistory" element={<DriverPointHistory />} />

        {/* Sponsor Routes */}
        <Route path="/SponsorDashboard" element={<SponsorDashboard />} />
        <Route path="/SponsorProfile" element={<SponsorProfile />} />
        <Route path="/SponsorApplications" element={<SponsorApplications />} />
        <Route path="SponsorViewDrivers" element={<SponsorViewDrivers />} />
        <Route path="/EbayTest" element={<EbayTestDashboard />} />

        {/* Admin Routes */}
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/AdminProfile" element={<AdminProfile />} />
        <Route path="/AdminApplications" element={<AdminApplications />} />
        <Route path="/AdminViewDrivers" element={<AdminViewDrivers />} />
      </Routes>
    </>
  );
}

export default App;
