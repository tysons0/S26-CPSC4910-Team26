import "../css/NavBar.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import apiService from "../services/api";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import { useImpersonation } from "../hooks/useImpersonation";

function NavBar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const { isImpersonating, exitImpersonation } = useImpersonation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await apiService.isAuthenticated();
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setIsAuthenticated(authenticated);
      setUserRole(storedUser.role || apiService.getUserRole());
      setCurrentUser(storedUser);
    };

    checkAuth();

    window.addEventListener("authChange", checkAuth);
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("authChange", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const handleLogout = () => {
    if (isImpersonating()) {
      const returnPath = exitImpersonation();
      window.dispatchEvent(new Event("authChange"));
      navigate(returnPath);
      return;
    }

    apiService.logout();
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("authChange"));
    navigate("/Login");
  };

  const getDashboardLink = () => {
    const role = userRole?.toLowerCase();
    if (role == "driver") return "/DriverDashboard";
    if (role == "sponsor") return "/SponsorDashboard";
    if (role == "admin") return "/AdminDashboard";
    return "/";
  };

  const getProfileLink = () => {
    const role = userRole?.toLowerCase();
    if (role == "driver") return "/DriverProfile";
    if (role == "sponsor") return "/SponsorProfile";
    if (role == "admin") return "/AdminProfile";
    return "/";
  };

  const impersonating = isImpersonating();

  return (
    <nav className="NavBar">
      <h2 className="project-title">Good Driver Incentive Program</h2>

      <Link to="/"> About </Link>

      {!isAuthenticated && <Link to="/DriverSignUp"> Sign Up </Link>}
      {isAuthenticated && <Link to={getDashboardLink()}> Dashboard </Link>}
      {isAuthenticated && <Link to={getProfileLink()}> Profile </Link>}
      {isAuthenticated && userRole?.toLowerCase() === "driver" && (
        <Link to="/Organizations"> Organizations </Link>
      )}

      {isAuthenticated && <NotificationBell />}

      <ThemeToggle />

      {/* Impersonation indicator */}
      {impersonating && (
        <span
          style={{
            fontSize: "0.78rem",
            color: "#667eea",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: "6px",
            border: "1px solid rgba(102,126,234,0.35)",
            background: "rgba(102,126,234,0.08)",
          }}
        >
          👤 {currentUser?.username}
        </span>
      )}

      {isAuthenticated ? (
        <button onClick={handleLogout} className="nav-link-button">
          {impersonating ? "Exit Impersonation" : "Logout"}
        </button>
      ) : (
        <Link to="/Login"> Login</Link>
      )}
    </nav>
  );
}

export default NavBar;
