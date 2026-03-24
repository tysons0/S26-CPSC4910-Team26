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

  // eBay search state
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Selected product + add form
  const [selectedProduct, setSelectedProduct] = useState(null);
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

  const handleLogout = () => {
    apiService.logout();
    window.dispatchEvent(new Event("authChange"));
    navigate("/Login");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchProducts = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setSelectedProduct(null);
    setFormData({ ebayItemId: "", points: "" });

    const keyword = searchKeyword.trim();
    if (!keyword) {
      setError("Please enter a keyword to search eBay products.");
      return;
    }

    setSearchLoading(true);

    try {
      const result = await apiService.searchEbayProducts(keyword, 12);
      const products = Array.isArray(result?.products) ? result.products : [];
      setSearchResults(products);

      if (products.length === 0) {
        setSuccessMessage("No eBay products were found for that search.");
      }
    } catch (err) {
      console.error("Error searching eBay products:", err);
      setError(err.message || "Failed to search eBay products.");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setError("");
    setSuccessMessage("");
    setFormData((prev) => ({
      ...prev,
      ebayItemId: product?.itemId || "",
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const ebayItemId = formData.ebayItemId.trim();
    const points = Number(formData.points);

    if (!ebayItemId) {
      setError("Please select an eBay product first.");
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
      await apiService.addCatalogItem(sponsorOrgId, {
        ebayItemId,
        points,
      });

      setSuccessMessage("Product added to your organization catalog.");
      setFormData({
        ebayItemId: "",
        points: "",
      });
      setSelectedProduct(null);

      await loadCatalog(sponsorOrgId);
    } catch (submitError) {
      console.error("Error adding catalog product:", submitError);
      setError(submitError.message || "Failed to add product to catalog.");
    } finally {
      setSubmitting(false);
    }
  };

  /*
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
  */

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

      <div style={{ marginBottom: "1rem" }}>
        <Link to="/EbayTest">
          <button className="submit" style={{ marginRight: "1rem" }}>
            Test eBay Products
          </button>
        </Link>
      </div>

      <div style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Search eBay Products</h2>

        <form onSubmit={handleSearchProducts} style={{ maxWidth: "500px" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="searchKeyword">Keyword</label>
            <input
              id="searchKeyword"
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Search for products"
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.35rem",
              }}
            />
          </div>

          <button type="submit" className="submit" disabled={searchLoading}>
            {searchLoading ? "Searching..." : "Search eBay"}
          </button>
        </form>
      </div>

      {/* Search Results */}
      <div style={{ marginBottom: "2rem" }}>
        <h2>Search Results</h2>

        {searchLoading ? (
          <p>Searching products...</p>
        ) : searchResults.length === 0 ? (
          <p>No eBay products loaded yet. Search above to see products.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            {searchResults.map((product) => {
              const isSelected = selectedProduct?.itemId === product?.itemId;

              return (
                <div
                  key={product?.itemId || Math.random()}
                  style={{
                    border: isSelected
                      ? "2px solid #2c7be5"
                      : "1px solid #dcdcdc",
                    borderRadius: "10px",
                    padding: "1rem",
                    backgroundColor: "#fff",
                  }}
                >
                  {product?.image ? (
                    <img
                      src={product.image}
                      alt={product?.name || "Product"}
                      style={{
                        width: "100%",
                        height: "180px",
                        objectFit: "contain",
                        marginBottom: "0.75rem",
                        borderRadius: "8px",
                        backgroundColor: "#fafafa",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "180px",
                        marginBottom: "0.75rem",
                        borderRadius: "8px",
                        backgroundColor: "#f3f3f3",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#666",
                        fontSize: "0.95rem",
                      }}
                    >
                      No image available
                    </div>
                  )}

                  <h3 style={{ marginTop: 0 }}>
                    {product?.name || "Unnamed Product"}
                  </h3>

                  <p style={{ margin: "0.4rem 0" }}>
                    <strong>Price:</strong>{" "}
                    {product?.price != null
                      ? `${product.price} ${product?.currency || ""}`
                      : "N/A"}
                  </p>

                  <p style={{ margin: "0.4rem 0" }}>
                    <strong>Condition:</strong> {product?.condition || "N/A"}
                  </p>

                  <p style={{ margin: "0.4rem 0", wordBreak: "break-word" }}>
                    <strong>Item ID:</strong> {product?.itemId || "N/A"}
                  </p>

                  {product?.itemWebUrl && (
                    <p style={{ margin: "0.4rem 0 0.8rem 0" }}>
                      <a
                        href={product.itemWebUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on eBay
                      </a>
                    </p>
                  )}

                  <button
                    type="button"
                    className="submit"
                    onClick={() => handleSelectProduct(product)}
                  >
                    {isSelected ? "Selected" : "Select Product"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Selected Product */}
      <div style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Add Product to Catalog</h2>

        {!selectedProduct ? (
          <p>Select a product from the search results above.</p>
        ) : (
          <>
            <div
              style={{
                border: "1px solid #dcdcdc",
                borderRadius: "10px",
                padding: "1rem",
                marginBottom: "1rem",
                backgroundColor: "#fff",
                maxWidth: "600px",
              }}
            >
              <p>
                <strong>Selected Product:</strong>{" "}
                {selectedProduct?.name || "Unnamed Product"}
              </p>
              <p>
                <strong>Item ID:</strong> {selectedProduct?.itemId || "N/A"}
              </p>
              <p>
                <strong>Price:</strong>{" "}
                {selectedProduct?.price != null
                  ? `${selectedProduct.price} ${
                      selectedProduct?.currency || ""
                    }`
                  : "N/A"}
              </p>
            </div>

            <form onSubmit={handleAddProduct} style={{ maxWidth: "420px" }}>
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
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginTop: "0.35rem",
                  }}
                />
              </div>

              <button
                type="submit"
                className="submit"
                disabled={submitting || !sponsorOrgId}
              >
                {submitting ? "Adding Product..." : "Add Product to Catalog"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Current Catalog */}
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
