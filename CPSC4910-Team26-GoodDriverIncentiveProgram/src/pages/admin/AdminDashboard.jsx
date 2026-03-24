import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import ProductCard from "../../components/Product";
import apiService from "../../services/api";
import "../../css/Dashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleChange = (e) => {
    const value = e.target.value;
    if (value) {
      navigate(value);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await apiService.getUserInfo();
        if (userData) {
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="Product Dashboard" />
      <h1>Admin Dashboard</h1>
      <p>
        Welcome back, <strong> {user?.username || "Admin"}! </strong>! This is
        where you can view all the Drivers and Sponsors.
      </p>
      <Link to="/Login">
        <button className="submit"> Logout </button>
      </Link>

      <h2> Applications </h2>
      <div style={{ marginBottom: "1rem" }}>
        <Link to="/AdminApplications">
          <button className="submit" style={{ marginRight: "1rem" }}>
            Manage Applications
          </button>
        </Link>
      </div>

      <h2>Manage Users</h2>
      <div style={{ marginBottom: "1rem" }}>
        <select onChange={handleChange} defaultValue="">
          <option value="" disabled>
            Select user type
          </option>
          <option value="/AdminViewDrivers">Drivers</option>
          <option value="/AdminViewSponsors">Sponsors</option>
          <option value="/AdminViewAdmins">Admins</option>
        </select>
      </div>

      <h2>Create Users</h2>

      <div style={{ marginBottom: "1rem" }}>
        <Link to="/DriverSignUp">
          <button className="submit" style={{ marginRight: "1rem" }}>
            Register Driver
          </button>
        </Link>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <Link to="/SponsorSignUp">
          <button className="submit" style={{ marginRight: "1rem" }}>
            Register Sponsor
          </button>
        </Link>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <Link to="/AdminSignUp">
          <button className="submit" style={{ marginRight: "1rem" }}>
            Register Admin
          </button>
        </Link>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <Link to="/CreateOrganization">
          <button className="submit" style={{ marginRight: "1rem" }}>
            Create Organization
          </button>
        </Link>
      </div>

      <div className="back-link">
        <p>
          <Link to="/">Back to About Page</Link>
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;
