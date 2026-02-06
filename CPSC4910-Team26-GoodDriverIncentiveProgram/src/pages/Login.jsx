import "../css/Login.css";
import { Link } from "react-router-dom";

function Login() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Login</h1>

      <form>
        <div>
          <label>Enter your Username or Email</label>
          <br />
          <input type="text" placeholder="username or email" />
        </div>

        <div>
          <label>Password</label>
          <br />
          <input type="password" placeholder="••••••••" />
        </div>
        <Link to="/Dashboard">
          <button className="lsubmit"> Login </button>
        </Link>
      </form>
      <p>
        <label>Don't have an account? </label>
        <Link to="/SignUp">Sign Up Here to become a Driver</Link>
      </p>
      <p>
        <Link to="/">Back to About Page</Link>
      </p>
    </div>
  );
}

export default Login;
