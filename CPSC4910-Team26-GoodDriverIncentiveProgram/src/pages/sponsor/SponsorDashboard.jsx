import { Link } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import ProductCard from "../../components/Product";
import "../../css/Dashboard.css";

function SponsorDashboard() {
  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="Product Dashboard" />
      <h1>Sponsor Dashboard</h1>
      <Link to="/Login">
        <button className="submit"> Logout </button>
      </Link>
      <p>
        Welcome to the Sponsor Dashboard! This is where you can view your
        catalog and manage products.
      </p>
      <h2>Manage Sponsor Orgs and other Sponsors</h2>
    </div>
  );
}

export default SponsorDashboard;
