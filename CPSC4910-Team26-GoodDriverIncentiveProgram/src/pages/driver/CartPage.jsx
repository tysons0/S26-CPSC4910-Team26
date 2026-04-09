import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import PovBanner from "../../components/POVBanner";

function CartPage() {
  const { cartItems, removeFromCart } = useCart();
  const navigate = useNavigate();

  const totalPoints = cartItems.reduce(
    (sum, item) => sum + item.points * item.quantity,
    0,
  );

  return (
    <div className="catalog-page">
      <PovBanner />
      <PageTitle title="Your Cart | Team 26" />
      <h1>Your Cart</h1>
      {cartItems.length === 0 ? (
        <>
          <p>Your cart is empty.</p>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              className="submit"
              onClick={() => navigate("/DriverWishlist")}
            >
              Wishlist
            </button>
            <button
              className="submit"
              onClick={() => navigate("/DriverDashboard")}
            >
              Continue Shopping
            </button>
          </div>
        </>
      ) : (
        <div className="catalog-list">
          {cartItems.map((item) => (
            <div className="catalog-row" key={item.id}>
              <img
                src={item.image}
                className="catalog-img"
                alt={item.name}
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
              <div className="col name">
                <div className="product-name">{item.name}</div>
              </div>
              <div className="col points">
                <p>Points: {item.points}</p>
              </div>

              <div className="col quantity">
                <p>Quantity: 1</p>
              </div>
              <button onClick={() => removeFromCart(item.id)}>Remove</button>
            </div>
          ))}
          <h2>Total Points: {totalPoints}</h2>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              className="submit"
              onClick={() => navigate("/DriverWishlist")}
            >
              Wishlist
            </button>
            <button
              className="submit"
              onClick={() => navigate("/DriverDashboard")}
            >
              Continue Shopping
            </button>
            <button className="submit" onClick={() => navigate("/Checkout")}>
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
