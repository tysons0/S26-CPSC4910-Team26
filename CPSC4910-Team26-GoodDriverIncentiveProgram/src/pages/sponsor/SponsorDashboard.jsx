import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/Dashboard.css";

function SponsorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sponsorOrgId, setSponsorOrgId] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    ebayItemId: "",
    points: "",
  });

  const loadCatalog = async (orgId) => {
    setCatalogLoading(true);
    try {
      const items = await apiService.getCatalog(orgId);
      setCatalogItems(Array.isArray(items) ? items : []);
    } catch (catalogError) {
      console.error("Error loading catalog:", catalogError);
      setError(catalogError.message || "Failed to load catalog items.");
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!apiService.isAuthenticated()) {
          navigate("/Login");
          return;
        }

        const userData = await apiService.getUserInfo();
        if (userData) {
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }

        const sponsorData = await apiService.getMySponsorInfo();
        const orgId = sponsorData?.organizationId;

        if (!orgId) {
          throw new Error("Unable to determine your sponsor organization.");
        }

        setSponsorOrgId(orgId);
        await loadCatalog(orgId);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError(error.message || "Failed to load sponsor dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const ebayItemId = formData.ebayItemId.trim();
    const points = Number(formData.points);

    if (!ebayItemId) {
      setError("eBay item ID is required.");
      return;
    }

    if (!Number.isFinite(points) || points <= 0) {
      setError("Points must be a positive number.");
      return;
    }

    if (!sponsorOrgId) {
      setError("Sponsor organization is not available.");
      return;
    }

    setSubmitting(true);

    try {
      await apiService.addCatalogItem(sponsorOrgId, { ebayItemId, points });
      setSuccessMessage("Product added to your organization catalog.");
      setFormData({ ebayItemId: "", points: "" });
      await loadCatalog(sponsorOrgId);
    } catch (submitError) {
      console.error("Error adding catalog product:", submitError);
      setError(submitError.message || "Failed to add product to catalog.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    apiService.logout();
    window.dispatchEvent(new Event("authChange"));
    navigate("/Login");
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="Product Dashboard" />
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="Product Dashboard" />
      <h1>Sponsor Dashboard</h1>
      <button className="submit" onClick={handleLogout}>
        Logout
      </button>
      <p>
        Welcome back <strong> {user?.username || "Sponsor"}!</strong> This is
        where you can view your catalog and manage products.
      </p>
      <p>
        <strong>Organization ID:</strong> {sponsorOrgId ?? "N/A"}
      </p>

      {error && (
        <p style={{ color: "#e74c3c", fontWeight: 600, marginTop: "1rem" }}>
          {error}
        </p>
      )}
      {successMessage && (
        <p style={{ color: "#27ae60", fontWeight: 600, marginTop: "1rem" }}>
          {successMessage}
        </p>
      )}

      <div style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Add Product to Catalog</h2>
        <form onSubmit={handleAddProduct} style={{ maxWidth: "420px" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="ebayItemId">eBay Item ID</label>
            <input
              id="ebayItemId"
              name="ebayItemId"
              type="text"
              value={formData.ebayItemId}
              onChange={handleFormChange}
              placeholder="v1|1234567890|0"
              required
              style={{ width: "100%", padding: "0.5rem", marginTop: "0.35rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="points">Points Cost</label>
            <input
              id="points"
              name="points"
              type="number"
              min="1"
              value={formData.points}
              onChange={handleFormChange}
              placeholder="100"
              required
              style={{ width: "100%", padding: "0.5rem", marginTop: "0.35rem" }}
            />
          </div>

          <button
            type="submit"
            className="submit"
            disabled={submitting || !sponsorOrgId}
          >
            {submitting ? "Adding Product..." : "Add Product"}
          </button>
        </form>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h2>Current Catalog</h2>
        {catalogLoading ? (
          <p>Loading catalog...</p>
        ) : catalogItems.length === 0 ? (
          <p>No catalog products found for this organization.</p>
        ) : (
          <ul style={{ paddingLeft: "1.25rem" }}>
            {catalogItems.map((item) => (
              <li
                key={
                  item.catalogItemID ?? item.catalogItemId ?? item.ebayItemId
                }
                style={{ marginBottom: "0.65rem" }}
              >
                <strong>{item.title || item.name || "Catalog Item"}</strong> -{" "}
                {item.points} points
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2>Manage Organization</h2>

      <div style={{ marginBottom: "1rem" }}>
        <Link to="/SponsorApplications">
          <button className="submit" style={{ marginRight: "1rem" }}>
            View Applications
          </button>
        </Link>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <Link to="/SponsorViewDrivers">
          <button className="submit" style={{ marginRight: "1rem" }}>
            View Drivers
          </button>
        </Link>
      </div>

      <p>
        Register a Sponsor <Link to="/SponsorSignUp">Create one Here</Link>
      </p>
    </div>
  );
}

export default SponsorDashboard;
