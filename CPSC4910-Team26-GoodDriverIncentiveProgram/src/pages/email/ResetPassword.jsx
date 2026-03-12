import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import apiService from "../../services/api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const username = searchParams.get("username");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiService.resetPassword(token, newPassword);
      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => navigate("/Login"), 2000);
    } catch (err) {
      setError(err.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Invalid Link</h1>
          <p className="login-subtitle">This reset link is invalid or has expired.</p>
          <div className="back-link">
            <Link to="/Login">Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">

        <h1>Reset Password</h1>
        {username && (
          <p className="login-subtitle">
            Enter new password for <strong>{username}</strong>
          </p>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-wrapper">
              <input
                id="newPassword"
                type={showNew ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-wrapper">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && <p className="login-error" style={{ color: "var(--success, green)" }}>{message}</p>}
        {error && <p className="login-error">{error}</p>}

        <div className="back-link">
          <Link to="/Login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;