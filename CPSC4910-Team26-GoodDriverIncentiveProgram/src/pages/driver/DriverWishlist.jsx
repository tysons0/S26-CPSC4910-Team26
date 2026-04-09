import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import { useCart } from "../../context/CartContext";
import "../../css/Dashboard.css";
import PovBanner from "../../components/POVBanner";

function DriverWishlist() {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const { addToCart } = useCart();
  const loadWishlist = async () => {
    try {
      const userData = await apiService.getUserInfo();
      setUser(userData);

      const driver = await apiService.getDriverByUserId(userData.id);

      const wishlistItems = await apiService.getDriverWishlist(driver.driverId);
      console.log("Raw wishlist data:", wishlistItems);
      const normalized = (
        Array.isArray(wishlistItems) ? wishlistItems : []
      ).map((item) => ({
        id: item.catalogItemID || item.CatalogItemID || item.catalogItemId,
        name: item.name || item.Name,
        points: Number(item.points ?? item.Points ?? 0),
        image:
          item.imageURL ||
          item.ImageUrl ||
          "https://via.placeholder.com/120?text=No+Image",
        itemWebUrl: item.itemWebUrl || item.ItemWebUrl || "",
      }));

      setWishlist(normalized);
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
        prev.filter((item) => item.catalogItemId !== catalogItemId),
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
        prev.filter((item) => item.catalogItemId !== catalogItemId),
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
      <PovBanner />
      <PageTitle title="Wishlist | Team 26" />

      <header className="catalog-header">
        <h1>Your Wishlist</h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <button className="submit" onClick={() => navigate("/Cart")}>
            View Cart
          </button>
          <button
            className="submit"
            onClick={() => navigate("/DriverDashboard")}
          >
            Back to Catalog
          </button>
        </div>
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
                  src={item.image}
                  alt={item.name}
                  className="catalog-img"
                  onError={(e) => {
                    if (
                      e.target.src !==
                      "https://via.placeholder.com/120?text=No+Image"
                    ) {
                      e.target.src =
                        "https://via.placeholder.com/120?text=No+Image";
                    }
                  }}
                />
              </div>

              <div className="col name">
                <div className="product-name">{item.name}</div>
              </div>

              <div className="col points">
                <div className="muted">Points:</div>
                <strong style={{ color: "black" }}>{item.points}</strong>
              </div>

              <div
                className="col action"
                style={{ display: "flex", gap: "10px" }}
              >
                <button className="submit" onClick={() => addToCart(item)}>
                  Add to Cart
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
