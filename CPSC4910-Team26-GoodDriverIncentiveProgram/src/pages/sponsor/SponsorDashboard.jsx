import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import ProductCard from "../../components/product";
import apiService from "../../services/api";
import "../../css/Dashboard.css";

function SponsorDashboard() {
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
      <h1>Sponsor Dashboard</h1>
      <Link to="/Login">
        <button className="submit"> Logout </button>
      </Link>
      <p>
        Welcome back <strong> {user?.username || "Sponsor"}!</strong> This is
        where you can view your catalog and manage products.
      </p>
      <h2>Manage Sponsor Orgs and other Sponsors</h2>
      <p>
        Register a Sponsor <Link to="/SponsorSignUp">Create one Here</Link>
      </p>
    </div>
  );
}

export default SponsorDashboard;
