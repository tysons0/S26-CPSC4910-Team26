import { Link } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import ProductCard from "../../components/Product";
import "../../css/Dashboard.css";

function AdminDashboard() {
  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="Product Dashboard" />
      <h1>Admin Dashboard</h1>
      <Link to="/">
        <button className="submit"> Logout </button>
      </Link>
      <p>
        Welcome to the Dashboard! This is where you can view all the Drivers and
        Sponsors.
      </p>
      <h2>Manage Users</h2>
    </div>
  );
}

export default AdminDashboard;
