import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/SponsorDashboard.css";
import PovBanner from "../../components/POVBanner";

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
  const [drivers, setDrivers] = useState([]);
  const [applications, setApplications] = useState([]);

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
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingPoints, setEditingPoints] = useState("");
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState("");
  const [uploadModal, setUploadModal] = useState(null); // holds the result object

  const [povRole, setPovRole] = useState(null);

  //Manually add products by ebay item ID
  const [manualFormData, setManualFormData] = useState({
    ebayItemId: "",
    points: "",
  });

  const loadCatalog = async (orgId) => {
    setCatalogLoading(true);
    try {
      const items = await apiService.getCatalog(orgId);
      console.log("Catalog response:", items);
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
        const userRole = apiService.getUserRole();
        if (
          userRole?.toLowerCase() !== "sponsor" &&
          userRole?.toLowerCase() !== "admin"
        ) {
          navigate("/About");
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

        // Fetch catalog and drivers at the same time
        const [, orgDrivers] = await Promise.all([
          loadCatalog(orgId),
          apiService.getOrganizationDrivers(orgId),
        ]);

        setDrivers(orgDrivers);

        const applications = await apiService.getApplications();
        setApplications(applications);
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

  const handlePovChange = (e) => {
    const role = e.target.value;
    if (role) {
      sessionStorage.setItem("sponsorPovRole", role);
      navigate(role === "driver" ? "/DriverDashboard" : "/AdminDashboard");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualFormChange = (e) => {
    const { name, value } = e.target;
    setManualFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      const result = await apiService.searchEbayProducts(keyword, 25);
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
      const addedItem = await apiService.addCatalogItem(sponsorOrgId, {
        ebayItemId,
        points,
      });

      console.log("Added selected product response:", addedItem);

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

  const handleManualAddProduct = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const ebayItemId = manualFormData.ebayItemId.trim();
    const points = Number(manualFormData.points);

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
      const addedItem = await apiService.addCatalogItem(sponsorOrgId, {
        ebayItemId,
        points,
      });

      console.log("Added manual product response:", addedItem);

      setSuccessMessage("Manual product added to your organization catalog.");
      setManualFormData({
        ebayItemId: "",
        points: "",
      });

      await loadCatalog(sponsorOrgId);
    } catch (submitError) {
      console.error("Error manually adding catalog product:", submitError);
      setError(submitError.message || "Failed to add product to catalog.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePoints = async (catalogItemId) => {
    setError("");
    setSuccessMessage("");
    const points = Number(editingPoints);

    if (!Number.isFinite(points) || points <= 0) {
      setError("Points must be a positive number.");
      return;
    }

    setUpdating(true);
    try {
      await apiService.updateCatalogItem(sponsorOrgId, catalogItemId, {
        points,
      });
      setSuccessMessage("Points updated successfully.");
      setEditingItemId(null);
      setEditingPoints("");
      await loadCatalog(sponsorOrgId);
    } catch (err) {
      console.error("Error updating catalog item:", err);
      setError(err.message || "Failed to update points.");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (catalogItemId) => {
    setError("");
    setSuccessMessage("");
    setRemoving(catalogItemId);
    try {
      await apiService.removeCatalogItem(sponsorOrgId, catalogItemId);
      setSuccessMessage("Item removed from catalog.");
      await loadCatalog(sponsorOrgId);
    } catch (err) {
      console.error("Error removing catalog item:", err);
      setError(err.message || "Failed to remove item.");
    } finally {
      setRemoving(null);
    }
  };

  const pendingApplications = applications.filter((app) => {
    const status = app.status?.toLowerCase();
    return (
      status === "pending" || status === "waiting" || status === "submitted"
    );
  });

  const handleUploadUsers = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const result = await apiService.uploadUsers(file);
      setUploadModal(result);

      // Refresh counts if anything succeeded
      if (result?.successes?.length > 0) {
        const [newDrivers, newSponsors, newOrgs] = await Promise.all([
          apiService.getDrivers().catch(() => []),
          apiService.getSponsors().catch(() => []),
          apiService.getOrganizations().catch(() => []),
        ]);
        setDrivers(Array.isArray(newDrivers) ? newDrivers : []);
        setSponsors(Array.isArray(newSponsors) ? newSponsors : []);
        setOrgs(Array.isArray(newOrgs) ? newOrgs : []);
      }
    } catch (error) {
      setUploadModal({
        successes: [],
        errors: [error.message || "Unknown error"],
        totalLines: 0,
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="Sponsor Dashboard" />
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="sponsor-shell">
      <PageTitle title="Sponsor Dashboard" />

      {/* Sidebar */}
      <aside className="sponsor-sidebar">
        <div className="sidebar-brand">
          <div className="brand-dot">S</div>
          <span className="brand-name">SponsorDashboard</span>
        </div>

        <span className="nav-section-label">Overview</span>
        <Link to="/SponsorDashboard" className="nav-item active">
          ⊞ Dashboard
        </Link>

        <span className="nav-section-label">Organization</span>
        <Link to={`/SponsorOrderHistory/${sponsorOrgId}`} className="nav-item">
          📝 Order History
        </Link>

        <Link to="/SponsorApplications" className="nav-item">
          📋 Applications
        </Link>
        <Link to="/SponsorViewDrivers" className="nav-item">
          🚗 View Drivers
        </Link>
        <Link to="/SponsorReport" className="nav-item">
          📊 Reports
        </Link>
        <Link to="/SponsorViewSponsors" className="nav-item">
          🧑‍💼 Our Sponsors
        </Link>
        <Link to="/SponsorSignUp" className="nav-item">
          ➕ Register Sponsor
        </Link>

        {/* Upload Users */}
        <input
          id="sponsor-sidebar-upload-input"
          type="file"
          accept=".txt,.csv,.psv"
          style={{ display: "none" }}
          onChange={handleUploadUsers}
        />
        <button
          className="nav-item"
          onClick={() =>
            document.getElementById("sponsor-sidebar-upload-input").click()
          }
          disabled={uploading}
          style={{ opacity: uploading ? 0.6 : 1 }}
        >
          📤 {uploading ? "Uploading..." : "Upload Users"}
        </button>

        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar">
              {user?.username?.[0]?.toUpperCase() || "S"}
            </div>
            <div>
              <div className="user-name">{user?.username || "Sponsor"}</div>
              <div className="user-role">Org ID: {sponsorOrgId ?? "N/A"}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="sponsor-main">
        <PovBanner />
        <header className="sponsor-topbar">
          <div>
            <div className="topbar-title">
              Welcome back, {user?.username || "Sponsor"} 👋
            </div>
            <div className="topbar-sub">
              Manage your catalog and organization from here.
            </div>
          </div>
        </header>

        <main className="sponsor-content">
          {/* Alerts */}
          {error && (
            <div
              style={{
                padding: "0.6rem 0.875rem",
                borderRadius: "8px",
                background: "rgba(231,76,60,0.08)",
                border: "1px solid rgba(231,76,60,0.25)",
                color: "#c0392b",
                fontSize: "0.85rem",
                marginBottom: "1.25rem",
              }}
            >
              {error}
            </div>
          )}
          {successMessage && (
            <div
              style={{
                padding: "0.6rem 0.875rem",
                borderRadius: "8px",
                background: "rgba(72,187,120,0.1)",
                border: "1px solid rgba(72,187,120,0.3)",
                color: "#276749",
                fontSize: "0.85rem",
                marginBottom: "1.25rem",
              }}
            >
              {successMessage}
            </div>
          )}

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Catalog Items</div>
              <div className="stat-value">{catalogItems.length}</div>
              <div className="stat-sub">Active products</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending Applications</div>
              <div className="stat-value">{pendingApplications.length}</div>
              <Link
                to="/SponsorApplications"
                style={{
                  color: "#667eea",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.75rem",
                }}
              >
                Needs review →
              </Link>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Drivers</div>
              <div className="stat-value">{drivers.length}</div>
              <Link
                to="/SponsorViewDrivers"
                style={{
                  color: "#667eea",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.75rem",
                }}
              >
                View all →
              </Link>
            </div>
          </div>

          {/* Add by eBay ID + Current Catalog */}
          <div className="sponsor-grid-2" style={{ marginBottom: "1.25rem" }}>
            <div className="section-card">
              <div className="section-title">Add Product by eBay ID</div>
              <form onSubmit={handleManualAddProduct}>
                <div style={{ marginBottom: "0.875rem" }}>
                  <label
                    htmlFor="manual-ebayItemId"
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-alt)",
                      fontWeight: 600,
                      display: "block",
                    }}
                  >
                    eBay Item ID
                  </label>
                  <input
                    id="manual-ebayItemId"
                    name="ebayItemId"
                    type="text"
                    value={manualFormData.ebayItemId}
                    onChange={handleManualFormChange}
                    placeholder="v1|1234567890|0"
                    required
                    className="view-select"
                    style={{ marginTop: "0.35rem" }}
                  />
                </div>
                <div style={{ marginBottom: "0.875rem" }}>
                  <label
                    htmlFor="manual-points"
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-alt)",
                      fontWeight: 600,
                      display: "block",
                    }}
                  >
                    Points Cost
                  </label>
                  <input
                    id="manual-points"
                    name="points"
                    type="number"
                    min="1"
                    value={manualFormData.points}
                    onChange={handleManualFormChange}
                    placeholder="100"
                    required
                    className="view-select"
                    style={{ marginTop: "0.35rem" }}
                  />
                </div>
                <button
                  type="submit"
                  className="submit"
                  style={{ width: "100%" }}
                  disabled={submitting || !sponsorOrgId}
                >
                  {submitting ? "Adding Product..." : "Add to Catalog"}
                </button>
              </form>
            </div>

            <div className="section-card">
              <div className="section-title">Current Catalog</div>
              {catalogLoading ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-alt)" }}>
                  Loading catalog...
                </p>
              ) : catalogItems.length === 0 ? (
                <p className="empty-state">No catalog products yet.</p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  {catalogItems.map((item) => {
                    const itemId =
                      item.catalogItemID ??
                      item.catalogItemId ??
                      item.ebayItemId;
                    const isEditing = editingItemId === itemId;
                    const isRemoving = removing === itemId;

                    return (
                      <div
                        key={itemId}
                        className="catalog-row"
                        style={{
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: "0.5rem",
                        }}
                      >
                        {/* Top row — name, badge, actions */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.5rem",
                          }}
                        >
                          <div>
                            <div className="catalog-name">
                              {item.title || item.name || "Catalog Item"}
                            </div>
                            <div className="catalog-meta">eBay item</div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              flexShrink: 0,
                            }}
                          >
                            <span className="pts-badge">{item.points} pts</span>
                            <button
                              onClick={() => {
                                setEditingItemId(isEditing ? null : itemId);
                                setEditingPoints(item.points);
                              }}
                              style={{
                                background: "transparent",
                                border: "1px solid var(--border)",
                                borderRadius: "6px",
                                padding: "0.2rem 0.5rem",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                                color: "var(--text-alt)",
                                transition: "border-color 0.15s",
                              }}
                            >
                              {isEditing ? "Cancel" : "✏️ Edit"}
                            </button>
                            <button
                              onClick={() => handleRemoveItem(itemId)}
                              disabled={isRemoving}
                              style={{
                                background: "transparent",
                                border: "1px solid rgba(231,76,60,0.3)",
                                borderRadius: "6px",
                                padding: "0.2rem 0.5rem",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                                color: "#c0392b",
                                transition: "border-color 0.15s",
                              }}
                            >
                              {isRemoving ? "..." : "🗑️ Remove"}
                            </button>
                          </div>
                        </div>

                        {/* Inline edit row — only shown when editing */}
                        {isEditing && (
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              alignItems: "center",
                              paddingTop: "0.4rem",
                              borderTop: "1px solid var(--border)",
                            }}
                          >
                            <input
                              type="number"
                              min="1"
                              value={editingPoints}
                              onChange={(e) => setEditingPoints(e.target.value)}
                              placeholder="New points value"
                              className="view-select"
                              style={{ flex: 1 }}
                            />
                            <button
                              onClick={() => handleUpdatePoints(itemId)}
                              disabled={updating}
                              className="submit"
                              style={{
                                whiteSpace: "nowrap",
                                padding: "0.5rem 1rem",
                                fontSize: "0.85rem",
                              }}
                            >
                              {updating ? "Saving..." : "Save"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* eBay Search */}
          <div className="section-card" style={{ marginBottom: "1.25rem" }}>
            <div className="section-title">Search eBay Products</div>
            <form
              onSubmit={handleSearchProducts}
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-end",
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="searchKeyword"
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-alt)",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "0.35rem",
                  }}
                >
                  Keyword
                </label>
                <input
                  id="searchKeyword"
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Search for products…"
                  className="view-select"
                />
              </div>
              <button
                type="submit"
                className="submit"
                disabled={searchLoading}
                style={{ whiteSpace: "nowrap" }}
              >
                {searchLoading ? "Searching..." : "Search eBay"}
              </button>
            </form>

            {searchLoading ? (
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-alt)",
                  marginTop: "1rem",
                }}
              >
                Searching products...
              </p>
            ) : searchResults.length === 0 ? (
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-alt)",
                  marginTop: "1rem",
                }}
              >
                No products loaded yet. Search above to see results.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "0.75rem",
                  marginTop: "1rem",
                }}
              >
                {searchResults.map((product) => {
                  const isSelected =
                    selectedProduct?.itemId === product?.itemId;
                  return (
                    <div
                      key={product?.itemId || Math.random()}
                      onClick={() => handleSelectProduct(product)}
                      style={{
                        background: isSelected
                          ? "linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.08))"
                          : "var(--bg)",
                        border: isSelected
                          ? "1px solid #667eea"
                          : "1px solid var(--border)",
                        borderRadius: "9px",
                        padding: "0.875rem",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {product?.image ? (
                        <img
                          src={product.image}
                          alt={product?.name || "Product"}
                          style={{
                            width: "100%",
                            height: "100px",
                            objectFit: "contain",
                            borderRadius: "6px",
                            background: "var(--surface-alt)",
                            marginBottom: "0.6rem",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100px",
                            borderRadius: "6px",
                            background: "var(--surface-alt)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.78rem",
                            color: "var(--text-alt)",
                            marginBottom: "0.6rem",
                          }}
                        >
                          No image
                        </div>
                      )}
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.82rem",
                          color: "var(--text-muted)",
                          lineHeight: 1.3,
                          marginBottom: "0.3rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {product?.name || "Unnamed Product"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-alt)",
                        }}
                      >
                        {product?.price != null
                          ? `${product.price} ${product?.currency || ""}`
                          : "N/A"}
                      </div>
                      {product?.itemWebUrl && (
                        <a
                          href={product.itemWebUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: "0.75rem",
                            color: "#667eea",
                            display: "block",
                            marginTop: "0.4rem",
                          }}
                        >
                          View on eBay ↗
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Selected + Manage Org */}
          <div className="sponsor-grid-2">
            <div className="section-card">
              <div className="section-title">
                Add Selected Product to Catalog
              </div>
              {!selectedProduct ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-alt)" }}>
                  Select a product from the search results above.
                </p>
              ) : (
                <>
                  <div
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "0.875rem",
                      marginBottom: "0.875rem",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "var(--text-muted)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {selectedProduct?.name || "Unnamed Product"}
                    </div>
                    <div
                      style={{ fontSize: "0.78rem", color: "var(--text-alt)" }}
                    >
                      Item ID: {selectedProduct?.itemId || "N/A"} &nbsp;·&nbsp;{" "}
                      {selectedProduct?.price != null
                        ? `${selectedProduct.price} ${selectedProduct?.currency || ""}`
                        : "N/A"}
                    </div>
                  </div>
                  <form onSubmit={handleAddProduct}>
                    <div style={{ marginBottom: "0.875rem" }}>
                      <label
                        htmlFor="points"
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-alt)",
                          fontWeight: 600,
                          display: "block",
                        }}
                      >
                        Points Cost
                      </label>
                      <input
                        id="points"
                        name="points"
                        type="number"
                        min="1"
                        value={formData.points}
                        onChange={handleFormChange}
                        placeholder="100"
                        required
                        className="view-select"
                        style={{ marginTop: "0.35rem" }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="submit"
                      style={{ width: "100%" }}
                      disabled={submitting || !sponsorOrgId}
                    >
                      {submitting ? "Adding Product..." : "Add to Catalog"}
                    </button>
                  </form>
                </>
              )}
            </div>

            <div className="section-card">
              <div className="section-title">Manage Organization</div>
              <div className="action-list">
                {[
                  {
                    to: `/SponsorOrderHistory/${sponsorOrgId}`,
                    icon: "📝",
                    label: "View Order History",
                    bg: "rgba(102,126,234,0.15)",
                  },
                  {
                    to: "/SponsorApplications",
                    icon: "📋",
                    label: "View Applications",
                    bg: "rgba(102,126,234,0.15)",
                  },
                  {
                    to: "/SponsorViewDrivers",
                    icon: "🚗",
                    label: "View Drivers",
                    bg: "rgba(72,187,120,0.15)",
                  },
                  {
                    to: "/SponsorViewSponsors",
                    icon: "🏢",
                    label: "View Organization's Sponsors",
                    bg: "rgba(237,137,54,0.15)",
                  },
                  {
                    to: "/SponsorSignUp",
                    icon: "➕",
                    label: "Register New Sponsor",
                    bg: "rgba(237,100,166,0.15)",
                  },
                  {
                    icon: "📤",
                    label: uploading ? "Uploading..." : "Upload Users",
                    bg: "rgba(102,126,234,0.15)",
                    isUpload: true,
                  },
                ].map(({ to, icon, label, bg, isUpload }) =>
                  isUpload ? (
                    <div
                      key="upload"
                      className="action-row"
                      onClick={() =>
                        document.getElementById("sponsor-upload-input").click()
                      }
                      style={{
                        cursor: uploading ? "not-allowed" : "pointer",
                        opacity: uploading ? 0.6 : 1,
                      }}
                    >
                      <div className="action-row-left">
                        <div className="action-icon" style={{ background: bg }}>
                          {icon}
                        </div>
                        {label}
                      </div>
                      <span style={{ color: "var(--text-alt)" }}>›</span>
                    </div>
                  ) : (
                    <Link key={to} to={to} className="action-row">
                      <div className="action-row-left">
                        <div className="action-icon" style={{ background: bg }}>
                          {icon}
                        </div>
                        {label}
                      </div>
                      <span style={{ color: "var(--text-alt)" }}>›</span>
                    </Link>
                  ),
                )}
              </div>

              <input
                id="sponsor-upload-input"
                type="file"
                accept=".txt,.csv,.psv"
                style={{ display: "none" }}
                onChange={handleUploadUsers}
              />
            </div>
          </div>
        </main>
      </div>
      {uploadModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setUploadModal(null)}
        >
          <div
            style={{
              background: "var(--surface-alt)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "2rem",
              width: "min(600px, 90vw)",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, color: "var(--text-muted)" }}>
              Upload Results
            </h2>

            <div
              style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem" }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-alt)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Total Lines
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                  }}
                >
                  {uploadModal.totalLines}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-alt)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Succeeded
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#68d391",
                  }}
                >
                  {uploadModal.successes?.length ?? 0}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-alt)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Errors
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#fc8181",
                  }}
                >
                  {uploadModal.errors?.length ?? 0}
                </div>
              </div>
            </div>

            {uploadModal.successes?.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ color: "#68d391", marginBottom: "0.5rem" }}>
                  ✓ Successes
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                  }}
                >
                  {uploadModal.successes.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(104,211,145,0.08)",
                        border: "1px solid rgba(104,211,145,0.2)",
                        borderRadius: "6px",
                        padding: "0.5rem 0.75rem",
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadModal.errors?.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#fc8181", marginBottom: "0.5rem" }}>
                  ✕ Errors
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                  }}
                >
                  {uploadModal.errors.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(252,129,129,0.08)",
                        border: "1px solid rgba(252,129,129,0.2)",
                        borderRadius: "6px",
                        padding: "0.5rem 0.75rem",
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setUploadModal(null)}
              style={{
                padding: "0.6rem 1.5rem",
                background: "rgba(102,126,234,0.12)",
                color: "#667eea",
                border: "1px solid rgba(102,126,234,0.3)",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SponsorDashboard;
