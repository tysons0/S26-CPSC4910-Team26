import { Link } from "react-router-dom";

function Login() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Login</h1>

      <form>
        <div>
          <label>Email</label>
          <br />
          <input type="email" />
        </div>

        <div>
          <label>Password</label>
          <br />
          <input type="password" />
        </div>

        <button type="submit">Login</button>
      </form>

      <p>
        <Link to="/">Back to Home</Link>
      </p>
    </div>
  );
}

export default Login;
