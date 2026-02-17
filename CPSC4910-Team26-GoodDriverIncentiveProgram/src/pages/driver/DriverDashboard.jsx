import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import ProductCard from "../../components/product";
import apiService from "../../services/api";
import ebayService from "../../services/ebayAPI";
import "../../css/Dashboard.css";

function DriverDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [error, setError] = useState("");
  const [minPoints, setMinPoints] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [availability, setAvailability] = useState("All");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await apiService.getUserInfo();
        if (userData) {
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    fetchProducts("");
  }, []);

  const fetchProducts = async (keyword = searchKeyword) => {
    setProductLoading(true);
    setError("");
    try {
      const ebayProducts = await ebayService.searchProducts(keyword, 12);
      setProducts(ebayProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products from eBay. Showing default products.");

      // Fallback to placeholder products if eBay fails
      setProducts([
        {
          name: "T-Shirt",
          points: 100,
          image: "https://via.placeholder.com/150",
        },
        { name: "Hat", points: 150, image: "https://via.placeholder.com/150" },
        {
          name: "Hoodie",
          points: 250,
          image: "https://via.placeholder.com/150",
        },
        { name: "Cup", points: 50, image: "https://via.placeholder.com/150" },
        {
          name: "Sunglasses",
          points: 75,
          image: "https://via.placeholder.com/150",
        },
        {
          name: "Backpack",
          points: 200,
          image: "https://via.placeholder.com/150",
        },
      ]);
    } finally {
      setProductLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      fetchProducts(searchKeyword);
    }
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

      const passMin = min === null || pts >= min;
      const passMax = max === null || pts <= max;

      const passAvail =
        availability === "All" ||
        String(p.availability || "")
          .toLowerCase()
          .includes(availability.toLowerCase());

      return passMin && passMax && passAvail;
    });
  }, [products, minPoints, maxPoints, availability]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    // Wireframe filters are client-side; if you want, you can also refetch by keyword:
    // fetchProducts(searchKeyword);
  };

  const handleViewDetails = (product) => {
    // Wireframe has "View Details / Redeem" :contentReference[oaicite:2]{index=2}
    // If you have a details page route, send product id there:
    // navigate(`/driver/products/${product.itemId}`);
    console.log("View details:", product);
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

  const sponsorName = "Sponsor Organization";

  return (
    <div className="catalog-page">
      <PageTitle title="Driver Catalog | Team 26" />

      {/* Top header like the wireframe title + points balance :contentReference[oaicite:3]{index=3} */}
      <header className="catalog-header">
        <div>
          <h1 className="catalog-title">
            {sponsorName}&apos;s Product Catalog
          </h1>
          <div className="catalog-points">
            Points Balance: <strong>{user?.points ?? 0}</strong>
          </div>
        </div>

        <button className="submit" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="catalog-layout">
        {/* Left Filters panel :contentReference[oaicite:4]{index=4} */}
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
                <option value="In Stock">In Stock</option>
                <option value="Limited">Limited</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            <button type="submit" className="submit">
              Apply
            </button>
          </form>

          {/* Optional search (not in wireframe, but useful) */}
          <div className="filter-divider" />

          <form onSubmit={handleSearch} className="filters-form">
            <div className="filter-block">
              <label className="filter-label">Search</label>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="tshirts, hats, sunglasses..."
              />
            </div>
            <button type="submit" className="submit" disabled={productLoading}>
              {productLoading ? "Searching..." : "Search"}
            </button>
          </form>
        </aside>

        {/* Right product list, wireframe-style rows (not a grid) :contentReference[oaicite:5]{index=5} */}
        <main className="catalog-results">
          {error && <div className="catalog-error">{error}</div>}

          <div className="catalog-list-header">
            <div className="col image">Image</div>
            <div className="col name">Product</div>
            <div className="col points">Points</div>
            <div className="col avail">Availability</div>
            <div className="col action" />
          </div>

          {productLoading ? (
            <p style={{ marginTop: "1rem" }}>Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <p style={{ marginTop: "1rem" }}>No products match your filters.</p>
          ) : (
            <div className="catalog-list">
              {filteredProducts.map((product) => (
                <div
                  className="catalog-row"
                  key={product.itemId || product.name}
                >
                  <div className="col image">
                    <img
                      src={product.image || "https://via.placeholder.com/120"}
                      alt={product.name}
                      className="catalog-img"
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
                    <strong>{product.availability || "Status"}</strong>
                  </div>

                  <div className="col action">
                    <button
                      className="linkish"
                      type="button"
                      onClick={() => handleViewDetails(product)}
                    >
                      View Details / Redeem
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DriverDashboard;
