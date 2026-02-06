import { Link } from "react-router-dom";
import PageTitle from "../components/PageTitle";
import "../css/SignUp.css"; 

function SignUp() {
  return (
    <div className="signup-container">
      <PageTitle title="Driver Signup" />

      <div className="signup-card">
        <h1 className="signup-title">Become a Driver!</h1>
        <p className="signup-subtitle">
          Join our community and start earning today
        </p>

        <form className="signup-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" placeholder="Your First Name" />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" placeholder="Your Last Name" />
            </div>
          </div>

          <div className="form-group">
            <label>Username</label>
            <input type="text" placeholder="Enter user name" />
          </div>

          <div className="form-group">
            <label>
              Email <span className="optional">(Optional)</span>
            </label>
            <input type="email" placeholder="your email" />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" placeholder="••••••••" />
          </div>

          <Link to="/Dashboard">
            <button type="button" className="submit-button">
              Sign Up
            </button>
          </Link>

          <p className="login-link">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignUp;
