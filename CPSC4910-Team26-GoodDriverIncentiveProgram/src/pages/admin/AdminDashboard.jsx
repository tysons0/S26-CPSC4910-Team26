import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import ProductCard from "../../components/product";
import apiService from "../../services/api";
import "../../css/Dashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <h2>Manage Users</h2>

      <div className="back-link">
        <p>
          Register a Driver <Link to="/DriverSignUp">Create one Here</Link>
        </p>
        <p>
          Register a Sponsor <Link to="/SponsorSignUp">Create one Here</Link>
        </p>
        <p>
          Register an Admin <Link to="/AdminSignUp">Create one Here</Link>
        </p>
        <p>
          <Link to="/">Back to About Page</Link>
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;
