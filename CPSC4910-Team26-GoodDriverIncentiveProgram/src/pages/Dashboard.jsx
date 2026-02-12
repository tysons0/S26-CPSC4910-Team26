import { Link } from "react-router-dom";
import PageTitle from "../components/PageTitle";
import ProductCard from "../components/Product";
import "../css/Dashboard.css";

function Dashboard() {
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
      <p>
        Welcome to the Dashboard! This is where you can view your driving stats
        and rewards.
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

export default Dashboard;
