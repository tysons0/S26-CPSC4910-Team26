import "../css/Login.css";
import PageTitle from "../components/PageTitle";
import { Link } from "react-router-dom";
import { useState } from "react";



function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-container">
      <div className="login-card">
        <PageTitle title="Login" />

        <h1>Login</h1>
        <p className="login-subtitle">Welcome back</p>

        <form className="login-form">
          <div className="form-group">
            <label>Enter your Username or Email</label>
            <input type="text" placeholder="username or email" />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
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

          <Link to="/Dashboard" className="login-submit">
            Login
          </Link>
        </form>

        <div className="back-link">
          <p>
            Don't have an account?{" "}
            <Link to="/SignUp">Sign Up Here to become a Driver</Link>
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
