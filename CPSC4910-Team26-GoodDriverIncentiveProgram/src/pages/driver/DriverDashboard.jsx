import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/Dashboard.css";
import { useCart } from "../../context/CartContext";
import PovBanner from "../../components/POVBanner";

function DriverDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [driverData, setDriverData] = useState(null);

  const [memberOrgs, setMemberOrgs] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState(null);
  const [activeOrgName, setActiveOrgName] = useState("Organization");

  const [organizationId, setOrganizationId] = useState(null);
  const [organizationName, setOrganizationName] = useState("Organization");

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [error, setError] = useState("");
  const [minPoints, setMinPoints] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [availability, setAvailability] = useState("All");

  const { addToCart, cartItems } = useCart();
  const isInCart = cartItems.some((item) => item.id === products.id);

  const loadCatalogProducts = async (orgId) => {
    setProductLoading(true);
    setError("");

    try {
      const catalogItems = await apiService.getCatalog(orgId);
      const normalizedProducts = (
        Array.isArray(catalogItems) ? catalogItems : []
      ).map((item) => ({
        id: item.catalogItemID ?? item.catalogItemId ?? item.ebayItemId,
        name: item.title || item.name || "Catalog Item",
        points: Number(item.points ?? 0),
        availability: item.isActive === false ? "Unavailable" : "Available",
        image:
          item.imageUrl ||
          item.image ||
          "https://via.placeholder.com/120?text=No+Image",
        itemWebUrl: item.itemWebUrl || "",
      }));

      setProducts(normalizedProducts);
    } catch (catalogError) {
      console.error("Error loading organization catalog:", catalogError);
      setError(catalogError.message || "Failed to load organization catalog.");
      setProducts([]);
    } finally {
      setProductLoading(false);
    }
  };

  useEffect(() => {
    const fetchDriverCatalog = async () => {
      try {
        if (!apiService.isAuthenticated()) {
          navigate("/Login");
          return;
        }

        const userData = await apiService.getDriverInfo();
        if (!userData) {
          throw new Error("Unable to load user profile.");
        }
        console.log("Fetched user data:", userData);
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));

        //Fetches drivers data
        const driver = await apiService.getDriverByUserId(userData.userData.id);
        setDriverData(driver);

        // Fetches Organizations and Drivers Applications
        const [allOrgs, myApplications] = await Promise.all([
          apiService.getOrganizations().catch(() => []),
          apiService.getMyApplications().catch(() => []),
        ]);

        //Creates array for Orgs
        const orgsArray = Array.isArray(allOrgs)
          ? allOrgs
          : (allOrgs?.organizations ?? []);
        //Creates array for Drivers applications
        const appsArray = Array.isArray(myApplications)
          ? myApplications
          : (myApplications?.applications ?? []);

        //Set of acceptedOrgs
        const acceptedOrgIds = new Set();

        //Checks if the Driver has been accepeted to an Org based on their applicationStatus
        const hasAcceptedAppForPrimaryOrg = appsArray.some(
          (a) =>
            String(a.orgId) === String(driver?.organizationId) &&
            (a.status || "").toLowerCase() === "accepted",
        );

        //If an OrgId is in AccepetedApp then the OrgId is added into accepetedOrgs
        if (driver?.organizationId && hasAcceptedAppForPrimaryOrg) {
          acceptedOrgIds.add(String(driver.organizationId));
        }

        appsArray
          .filter((a) => (a.status || "").toLowerCase() === "accepted")
          .forEach((a) => acceptedOrgIds.add(String(a.orgId)));

        //Creates a membership for the Driver of the Orgs they are accepted to
        const memberships = orgsArray.filter((o) =>
          acceptedOrgIds.has(String(o.orgId)),
        );

        setMemberOrgs(memberships);

        if (memberships.length === 0) {
          setError(
            "You are not currently a member of any organization. Join one to view its catalog.",
          );
          return;
        }

        const savedOrgId = localStorage.getItem("activeOrgId");
        const defaultOrg =
          memberships.find((o) => String(o.orgId) === savedOrgId) || // last selected
          memberships.find(
            (o) => String(o.orgId) === String(driver?.organizationId),
          ) || // primary org
          memberships[0];

        setActiveOrgId(String(defaultOrg.orgId));
        setActiveOrgName(defaultOrg.name || "Organization");
        await loadCatalogProducts(defaultOrg.orgId);
      } catch (fetchError) {
        console.error("Error loading driver dashboard:", fetchError);
        setError(fetchError.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDriverCatalog();
  }, [navigate]);

  const handleSwitchOrg = async (orgId) => {
    const org = memberOrgs.find((o) => String(o.orgId) === String(orgId));
    if (!org) return;
    setActiveOrgId(String(org.orgId));
    setActiveOrgName(org.name || "Organization");
    localStorage.setItem("activeOrgId", String(org.orgId));
    setSearchKeyword("");
    setMinPoints("");
    setMaxPoints("");
    setAvailability("All");
    await loadCatalogProducts(org.orgId);
  };

  const handleSearch = (e) => e.preventDefault();
  const handleApplyFilters = (e) => e.preventDefault();

  const handleLogout = () => {
    apiService.logout();
    window.dispatchEvent(new Event("authChange"));
    navigate("/Login");
  };

  const handleAddToWishlist = async (product) => {
    try {
      if (!user || !activeOrgId) return;
      const driver =
        driverData || (await apiService.getDriverByUserId(user.userData.id));
      await apiService.addWishlistItem(
        driver.driverId,
        activeOrgId,
        product.id,
      );
      alert(`Added "${product.name}" to your wishlist!`);
    } catch (err) {
      console.error("Error adding to wishlist:", err);
      alert("Failed to add product to wishlist. Please try again.");
    }
  };

  const filteredProducts = useMemo(() => {
    const min = minPoints === "" ? null : Number(minPoints);
    const max = maxPoints === "" ? null : Number(maxPoints);

    return products.filter((p) => {
      const pts = Number(p.points ?? 0);
      const searchMatch =
        searchKeyword.trim() === "" ||
        String(p.name || "")
          .toLowerCase()
          .includes(searchKeyword.trim().toLowerCase());

      const passMin = min === null || pts >= min;
      const passMax = max === null || pts <= max;

      const passAvail =
        availability === "All" ||
        String(p.availability || "")
          .toLowerCase()
          .includes(availability.toLowerCase());

      return searchMatch && passMin && passMax && passAvail;
    });
  }, [products, searchKeyword, minPoints, maxPoints, availability]);

  const handleViewDetails = (product) => {
    if (product.itemWebUrl) {
      window.open(product.itemWebUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) {
    return (
      <div className="catalog-page">
        <PageTitle title="Driver Catalog | Team 26" />
        <div className="catalog-shell">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="catalog-page">
      <PovBanner />
      <PageTitle title="Driver Catalog | Team 26" />

      <header className="catalog-header">
        <div>
          {memberOrgs.length > 1 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <h1 className="catalog-title" style={{ margin: 0 }}>
                Product Catalog
              </h1>
              <select
                value={activeOrgId ?? ""}
                onChange={(e) => handleSwitchOrg(e.target.value)}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  fontSize: "1rem",
                  cursor: "pointer",
                  background: "var(--surface)",
                  color: "var(--text)",
                }}
              >
                {memberOrgs.map((org) => (
                  <option key={org.orgId} value={String(org.orgId)}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <h1 className="catalog-title">
              {activeOrgName}&apos;s Product Catalog
            </h1>
          )}

          <div className="catalog-points">
            Points Balance: <strong>{user?.points ?? 0}</strong>
          </div>
          <Link to="/DriverPointHistory">
            <button className="submit">View Point History</button>
          </Link>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="submit" onClick={() => navigate("/OrderHistory")}>
            Order History
          </button>
          <button
            className="submit"
            onClick={() => navigate("/DriverWishlist")}
          >
            Wishlist
          </button>
          <button className="submit" onClick={() => navigate("/Cart")}>
            Cart ({cartItems.length})
          </button>
        </div>
      </header>

      <div className="catalog-layout">
        <aside className="catalog-filters">
          <h3>Filters</h3>

          <form onSubmit={handleApplyFilters} className="filters-form">
            <div className="filter-block">
              <label className="filter-label">Points Range:</label>
              <div className="filter-row">
                <input
                  type="number"
                  min="0"
                  value={minPoints}
                  onChange={(e) => setMinPoints(e.target.value)}
                  placeholder="Min Points"
                />
              </div>
              <div className="filter-row">
                <input
                  type="number"
                  min="0"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(e.target.value)}
                  placeholder="Max Points"
                />
              </div>
            </div>

            <div className="filter-block">
              <label className="filter-label">Availability:</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>

            <button type="submit" className="submit">
              Apply Filters
            </button>
          </form>

          <div className="filter-divider" />

          <form onSubmit={handleSearch} className="filters-form">
            <div className="filter-block">
              <label className="filter-label">Search Products</label>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Search catalog products..."
              />
            </div>
            <button type="submit" className="submit">
              Search
            </button>
          </form>

          <button
            onClick={() =>
              organizationId && loadCatalogProducts(organizationId)
            }
            className="submit"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={productLoading || !organizationId}
          >
            {productLoading ? "Refreshing..." : "Refresh Catalog"}
          </button>
        </aside>

        <main className="catalog-results">
          {error && <div className="catalog-error">{error}</div>}

          <div className="catalog-list-header">
            <div className="col image">Image</div>
            <div className="col name">Product</div>
            <div className="col points">Points</div>
            <div className="col avail">Availability</div>
            <div className="col action" />
          </div>

          {productLoading && products.length === 0 ? (
            <p style={{ marginTop: "1rem" }}>Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <p style={{ marginTop: "1rem" }}>No products match your filters.</p>
          ) : (
            <>
              <div className="catalog-list">
                {filteredProducts.map((product, index) => (
                  <div
                    className="catalog-row"
                    key={product.id || `${product.name}-${index}`}
                  >
                    <div className="col image">
                      <img
                        src={
                          product.image ||
                          "https://via.placeholder.com/120?text=No+Image"
                        }
                        alt={product.name}
                        className="catalog-img"
                        onError={(e) => {
                          // Prevent infinite loop - only set fallback once
                          if (
                            e.target.src !==
                            "https://via.placeholder.com/120?text=No+Image"
                          ) {
                            e.target.src =
                              "https://via.placeholder.com/120?text=No+Image";
                          }
                        }}
                        loading="lazy"
                      />
                    </div>

                    <div className="col name">
                      <div className="product-name">{product.name}</div>
                    </div>

                    <div className="col points">
                      <div className="muted">Points Price:</div>
                      <strong
                        style={{
                          color:
                            product.points > (user?.points ?? 0)
                              ? "#dc3545"
                              : "inherit",
                        }}
                      >
                        {product.points}
                      </strong>
                      {product.points > (user?.points ?? 0) && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#dc3545",
                            marginTop: "0.25rem",
                          }}
                        >
                          Insufficient Points
                        </div>
                      )}
                    </div>

                    <div className="col avail">
                      <div className="muted">Availability:</div>
                      <strong
                        style={{
                          color:
                            product.availability === "Unavailable"
                              ? "#dc3545"
                              : "#198754",
                        }}
                      >
                        {product.availability}
                      </strong>
                    </div>

                    <div
                      className="col action"
                      style={{ display: "flex", gap: "10px" }}
                    >
                      <button
                        className="linkish"
                        type="button"
                        onClick={() => handleViewDetails(product)}
                      >
                        View Details
                      </button>
                      <button
                        className="linkish"
                        type="button"
                        onClick={() => handleAddToWishlist(product)}
                      >
                        Add to Wishlist
                      </button>
                      <button
                        className="linkish"
                        type="button"
                        disabled={
                          product.points > (user?.points ?? 0) ||
                          product.availability === "Unavailable" ||
                          isInCart
                        }
                        onClick={() =>
                          addToCart({ ...product, catalogItemId: product.id })
                        }
                      >
                        {isInCart ? "In Cart" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default DriverDashboard;
