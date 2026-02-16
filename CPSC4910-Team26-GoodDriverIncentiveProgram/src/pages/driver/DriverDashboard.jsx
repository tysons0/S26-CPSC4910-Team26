import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import ProductCard from "../../components/Product";
import apiService from "../../services/api";
import "../../css/Dashboard.css";

function DriverDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const tempProducts = [
    {
      name: "T-Shirt",
      points: 100,
      image:
        "https://classicfella.com/products/structured-t-shirt-white?srsltid=AfmBOortMUsrMrOgGSrrBEbqjj_adWwsha717nECysAgdce5IysA_NkK",
    },
    { name: "Hat", points: 150, image: "https://via.placeholder.com/150" },
    { name: "Hoodie", points: 250, image: "https://via.placeholder.com/150" },
    { name: "Cup", points: 50, image: "https://via.placeholder.com/150" },
    {
      name: "Sunglasses",
      points: 75,
      image: "https://via.placeholder.com/150",
    },
    { name: "Backpack", points: 200, image: "https://via.placeholder.com/150" },
  ];
  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="Product Dashboard" />
      <h1>Dashboard</h1>
      <Link to="/Login">
        <button className="submit"> Logout </button>
      </Link>
      <p>
        Welcome back, <strong> {user?.username || "Driver"}! </strong>
      </p>
      <h2>Available Products</h2>
      <div className="product-grid">
        {tempProducts.map((product) => (
          <ProductCard product={product} key={product.name} />
        ))}
      </div>
    </div>
  );
}

export default DriverDashboard;
