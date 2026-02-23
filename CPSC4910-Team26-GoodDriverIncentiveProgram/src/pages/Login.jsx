import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiService from "../services/api";
import PageTitle from "../components/PageTitle";
import "../css/Login.css";

function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user } = await apiService.login({ userName, password });

      const role = user.role?.toLowerCase();

      window.dispatchEvent(new Event("authChange"));

      if (role === "admin") {
        navigate("/AdminDashboard");
      } else if (role === "driver") {
        navigate("/DriverDashboard");
      } else if (role === "sponsor") {
        navigate("/SponsorDashboard");
      } else {
        navigate("/About");
      }
    } catch (err) {
      
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <PageTitle title="Login | Team 26" />

      <div className="login-card">
        <h1>Login</h1>
        <p className="login-subtitle">Welcome back</p>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && <p className="login-error">{error}</p>}
        </form>

        <div className="back-link">
          <p>
            Don't have an account? <Link to="/DriverSignUp">Sign Up Here</Link>
          </p>
          <p>
            <Link to="/">Back to About Page</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
