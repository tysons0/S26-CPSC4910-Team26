import "../css/NavBar.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import apiService from "../services/api";

function NavBar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    //Check auth status
    const checkAuth = async () => {
      setIsAuthenticated(await apiService.isAuthenticated());
    };

    checkAuth();

    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener("authChange", handleAuthChange);

    // Listen for changes in localStorage to update auth status across tabs
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    apiService.logout();
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("storage"));
    navigate("/Login");
  };

  return (
    <nav className="NavBar">
      <h2 className="project-title">Good Driver Incentive Program</h2>
      <Link to="/"> About </Link>
      <Link to="/Sponsors"> View Sponsors </Link>
      <Link to="/Dashboard">Product Dashboard</Link>
      {isAuthenticated && <Link to="/Profile"> User Profile</Link>}

      {isAuthenticated ? (
        <button onClick={handleLogout} className="nav-link-button">
          Logout
        </button>
      ) : (
        <Link to="/Login"> Login</Link>
      )}
    </nav>
  );
}

export default NavBar;
