import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/Dashboard.css";

function DriverDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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

  const loadCatalogProducts = async (orgId) => {
    setProductLoading(true);
    setError("");

    try {
      const catalogItems = await apiService.getCatalog(orgId);
      const normalizedProducts = (Array.isArray(catalogItems) ? catalogItems : []).map((item) => ({
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

        const userData = await apiService.getUserInfo();
        if (!userData) {
          throw new Error("Unable to load user profile.");
        }

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));

        const driverData = await apiService.getDriverByUserId(userData.id);
        const driverOrgId = driverData?.organizationId;

        if (!driverOrgId) {
          setError(
            "You are not currently assigned to an organization. Join an organization to view its catalog.",
          );
          setProducts([]);
          return;
        }

        setOrganizationId(driverOrgId);

        try {
          const organizations = await apiService.getOrganizations();
          const matchingOrg = (Array.isArray(organizations) ? organizations : []).find(
            (organization) => organization.orgId === driverOrgId,
          );

          if (matchingOrg?.name) {
            setOrganizationName(matchingOrg.name);
          }
        } catch (orgError) {
          console.error("Error loading organizations:", orgError);
        }

        await loadCatalogProducts(driverOrgId);
      } catch (fetchError) {
        console.error("Error loading driver dashboard:", fetchError);
        setError(fetchError.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDriverCatalog();
  }, [navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleLogout = () => {
    apiService.logout();
    window.dispatchEvent(new Event("authChange"));
    navigate("/Login");
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

  const handleApplyFilters = (e) => {
    e.preventDefault();
  };

  const handleViewDetails = (product) => {
    if (product.itemWebUrl) {
      window.open(product.itemWebUrl, "_blank", "noopener,noreferrer");
      return;
    }

    console.log("No product details URL available", product);
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
      <PageTitle title="Driver Catalog | Team 26" />

      <header className="catalog-header">
        <div>
          <h1 className="catalog-title">
            {organizationName}&apos;s Product Catalog
          </h1>
          <div className="catalog-points">
            Points Balance: <strong>{user?.points ?? 0}</strong>
          </div>
        </div>
        <div style={{display: "flex", gap: "10px"}}>
          <button
            className="submit"
            onClick={() => navigate("/DriverWishlist")}
            >
            Wishlist
          </button>
          <button
            className="submit" onClick={handleLogout}
          >
            Logout
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
            onClick={() => organizationId && loadCatalogProducts(organizationId)}
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
                      <strong>{product.points}</strong>
                    </div>

                    <div className="col avail">
                      <div className="muted">Availability:</div>
                      <strong>{product.availability}</strong>
                    </div>

                    <div className="col action">
                      <button
                        className="linkish"
                        type="button"
                        onClick={() => handleViewDetails(product)}
                      >
                        View Details
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
