import "../css/NavBar.css";
import { Link } from "react-router-dom";

function NavBar() {
  return (
    <nav className="NavBar">
      <h2 className="project-title">Good Driver Incentive Program</h2>
      <Link to="/"> About </Link>
      <Link to="/Sponsors"> View Sponsors </Link>
      <Link to="/Dashboard">Product Dashboard</Link>
      <Link to="/Profile"> User Profile</Link>
      <Link to="/Login"> Login</Link>
    </nav>
  );
}

export default NavBar;
