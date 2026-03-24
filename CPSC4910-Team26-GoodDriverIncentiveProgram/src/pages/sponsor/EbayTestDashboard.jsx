import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/Dashboard.css";

function EbayTestDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("headphones");

  const loadProducts = async (searchTerm = "headphones") => {
    setLoading(true);
    setError("");

    try {
      const result = await apiService.searchEbayProducts(searchTerm, 12);
      console.log("eBay search result:", result);

      const productList = Array.isArray(result?.products)
        ? result.products
        : [];
      setProducts(productList);
    } catch (err) {
      console.error("Error loading eBay products:", err);
      setError(err.message || "Failed to load eBay products.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!apiService.isAuthenticated()) {
          navigate("/Login");
          return;
        }

        await loadProducts("headphones");
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError(err.message || "Failed to load dashboard.");
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = keyword.trim();

    if (!trimmed) {
      setError("Please enter a search keyword.");
      return;
    }

    await loadProducts(trimmed);
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="eBay Product Test" />
        <h1>Loading products...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="eBay Product Test" />
      <h1>Basic eBay Product Dashboard</h1>

      <p>
        This page is just for testing whether products are coming back from the
        eBay API.
      </p>

      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

      <form
        onSubmit={handleSearch}
        style={{ marginBottom: "2rem", maxWidth: "400px" }}
      >
        <label htmlFor="keyword">Search Keyword</label>
        <input
          id="keyword"
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            marginTop: "0.5rem",
            marginBottom: "0.75rem",
          }}
        />
        <button type="submit" className="submit">
          Search
        </button>
      </form>

      <h2>Products</h2>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
          }}
        >
          {products.map((product, index) => (
            <div
              key={product?.itemId || index}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "1rem",
                background: "#fff",
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
                    marginBottom: "1rem",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "180px",
                    background: "#f2f2f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1rem",
                  }}
                >
                  No image
                </div>
              )}

              <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
                {product?.name || "Unnamed Product"}
              </h3>

              <p>
                <strong>Item ID:</strong> {product?.itemId || "N/A"}
              </p>
              <p>
                <strong>Price:</strong> {product?.price ?? "N/A"}{" "}
                {product?.currency || ""}
              </p>
              <p>
                <strong>Condition:</strong> {product?.condition || "N/A"}
              </p>

              {product?.itemWebUrl && (
                <a href={product.itemWebUrl} target="_blank" rel="noreferrer">
                  View on eBay
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EbayTestDashboard;
