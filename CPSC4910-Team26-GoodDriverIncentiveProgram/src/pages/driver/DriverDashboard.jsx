import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
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
    fetchProducts();
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

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="Driver Dashboard | Team 26" />
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="Driver Dashboard | Team 26" />
      <h1>Dashboard</h1>

      <button className="submit" onClick={handleLogout}>
        Logout
      </button>

      <p>
        Welcome back, <strong> {user?.username || "Driver"}! </strong>
      </p>

      {user?.points !== undefined && (
        <p style={{ fontSize: "1rem", color: "#4a5568", marginTop: "0.5rem" }}>
          Current Points: <strong>{user.points}</strong>
        </p>
      )}

      {/* Search Bar */}
      <div style={{ margin: "2rem 0" }}>
        <h3>Search Products</h3>
        <form
          onSubmit={handleSearch}
          style={{
            display: "flex",
            gap: "1rem",
            maxWidth: "600px",
            marginTop: "1rem",
          }}
        >
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Search for products (e.g., tshirts, hats, sunglasses)..."
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "1rem",
            }}
          />
          <button
            type="submit"
            disabled={productLoading}
            className="submit"
            style={{ padding: "0.75rem 2rem" }}
          >
            {productLoading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {error && (
        <p style={{ color: "#e53e3e", marginBottom: "1rem" }}>{error}</p>
      )}

      <h2>Available Products</h2>
      {productLoading ? (
        <p>Loading products...</p>
      ) : (
        <div className="product-grid">
          {products.map((product, index) => (
            <ProductCard
              product={product}
              key={product.itemId || product.name || index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
