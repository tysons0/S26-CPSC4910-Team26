import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/Dashboard.css";

function DriverWishlist() {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const loadWishlist = async () => {
    try {
      const userData = await apiService.getUserInfo();
      setUser(userData);

      const driver = await apiService.getDriverByUserId(userData.id);

      const wishlistItems = await apiService.getDriverWishlist(driver.driverId);

      setWishlist(Array.isArray(wishlistItems) ? wishlistItems : []);
    } catch (err) {
      console.error("Wishlist load error", err);
      setError("Failed to load wishlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      navigate("/Login");
      return;
    }

    loadWishlist();
  }, [navigate]);

  const handleRemove = async (catalogItemId) => {
    try {
      await apiService.removeWishlistItem(catalogItemId);

      setWishlist((prev) =>
        prev.filter((item) => item.catalogItemId !== catalogItemId)
      );
    } catch (err) {
      console.error("Remove failed", err);
    }
  };

  const handlePurchase = async (catalogItemId) => {
    try {
      await apiService.purchaseItem(catalogItemId);

      alert("Item purchased successfully");

      setWishlist((prev) =>
        prev.filter((item) => item.catalogItemId !== catalogItemId)
      );
    } catch (err) {
      console.error("Purchase failed", err);
      alert("Purchase failed");
    }
  };

  if (loading) {
    return (
      <div className="catalog-page">
        <PageTitle title="Wishlist | Team 26" />
        <h1>Loading Wishlist...</h1>
      </div>
    );
  }

  return (
    <div className="catalog-page">
      <PageTitle title="Wishlist | Team 26" />

      <header className="catalog-header">
        <h1>Your Wishlist</h1>

        <button className="submit" onClick={() => navigate("/DriverDashboard")}>
          Back to Catalog
        </button>
      </header>

      {error && <div className="catalog-error">{error}</div>}

      {wishlist.length === 0 ? (
        <p style={{ marginTop: "1rem" }}>Your wishlist is empty.</p>
      ) : (
        <div className="catalog-list">
          {wishlist.map((item, index) => (
            <div className="catalog-row" key={item.catalogItemId || index}>
              <div className="col image">
                <img
                  src={
                    item.image ||
                    "https://via.placeholder.com/120?text=No+Image"
                  }
                  alt={item.name}
                  className="catalog-img"
                />
              </div>

              <div className="col name">
                <div className="product-name">{item.name}</div>
              </div>

              <div className="col points">
                <div className="muted">Points:</div>
                <strong>{item.points}</strong>
              </div>

              <div className="col action" style={{ display: "flex", gap: "10px" }}>
                <button
                  className="submit"
                  onClick={() => handlePurchase(item.catalogItemId)}
                >
                  Purchase
                </button>

                <button
                  className="linkish"
                  onClick={() => handleRemove(item.catalogItemId)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DriverWishlist;