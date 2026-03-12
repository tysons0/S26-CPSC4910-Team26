import { useState } from "react";
import apiService from "../../services/api";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await apiService.forgotPassword(email);
      setMessage("Reset link sent! Check your inbox.");
    } catch (err) {
      if (err.message.includes("No account found")) {
        setError("No account found with that email address.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {        
      setLoading(false);  
    }           
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Forgot Password</h1>
        <p className="login-subtitle">
          Enter your email and we'll send you a reset link.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;