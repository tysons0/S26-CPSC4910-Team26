import "../css/NavBar.css";
import { Link } from "react-router-dom";

function NavBar() {
  return (
    <nav className="NavBar">
      <h2 className="project-title">Good Driver Incentive Program</h2>

      <div className="nav-right">
        <Link to="/Login">
          <button className="login-btn"> Login </button>
        </Link>
      </div>
    </nav>
  );
}

export default NavBar;
