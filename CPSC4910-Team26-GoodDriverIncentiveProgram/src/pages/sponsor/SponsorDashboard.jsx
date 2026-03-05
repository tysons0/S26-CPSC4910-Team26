import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import ProductCard from "../../components/Product";
import apiService from "../../services/api";
import "../../css/Dashboard.css";

function SponsorDashboard() {
  const [user, setUser] = useState(null);
  const [sponsor, setSponsor] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await apiService.getUserInfo();
        if (userData) {
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }

        const sponsorData = await apiService.getSponsor();
        setSponsor(sponsorData);

        const orgId = sponsorData?.organizationId || sponsorData?.OrganizationId || sponsorData?.orgId;
        const orgData = await apiService.getOrganizationById(orgId);
        setOrganization(orgData);

        const catalogData = await apiService.getSponsorCatalog(orgId);
        setCatalog(catalogData);
      } catch (error) {
        console.error("Error loading sponsor dashboard data:", error);
        setError("Failed to load sponsor dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Refresh catalog data
  const refreshCatalog = async () => {
    try {
      setLoading(true);
      const orgId = sponsor?.organizationId || sponsor?.OrganizationId || sponsor?.orgId;
      const catalogData = await apiService.getSponsorCatalog(orgId);
      setCatalog(catalogData);
    } catch (error) {
      console.error("Error refreshing catalog:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search eBay for products to add to catalog
  const handleSearch = async (e) => {
    if (!searchTerm.trim()) return;

    try {
      const response = await apiService.searchEbayProducts(searchTerm);
      setSearchResults(response.products || []);
      console.log(response.products);
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  // Add Item to Catalog
  const handleAddProduct = async (product) => {
    const suggestedPoints = Math.ceil(product.price / (organization.pointWorth || 1));
    const userPoints = prompt(
      `Suggested Points: ${suggestedPoints}\nEnter point value:`,
      suggestedPoints
    );
    if (!userPoints) return;

    try {
      const orgId = sponsor?.organizationId || sponsor?.OrganizationId || sponsor?.orgId;
      await apiService.addCatalogItem(orgId, {
        ebayItemId: product.itemId,
        points: parseInt(userPoints)
      });
      
      refreshCatalog();
    } catch (error) {
      console.error("Error adding product to catalog:", error);
    }
  };

  // Update points for an existing catalog item
  const handleUpdatePoints = async (item) => {
    const newPoints = prompt("Enter new point amount:", item.points);
    if (!newPoints) return;

    try {
      const orgId = sponsor?.organizationId || sponsor?.OrganizationId || sponsor?.orgId;
      await apiService.updateCatalogItem(orgId, item.catalogItemId, {
        points: parseInt(newPoints)
      });
      refreshCatalog();
    } catch (error) {
      console.error("Error updating catalog item:", error);
    }
  };

  //Remove item from catalog
  const handleRemoveItem = async (item) => {
    if (!window.confirm(`Are you sure you want to remove ${item.Name} from the catalog?`)) return;
    try{
      const orgId = sponsor?.organizationId || sponsor?.OrganizationId || sponsor?.orgId;
      await apiService.removeCatalogItem(orgId, item.catalogItemId);
      refreshCatalog();
    } catch (error) {
      console.error("Error removing catalog item:", error);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="Product Dashboard" />
      
      {loading && <p>Loading dashboard...</p>}
      
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      {!loading && !error && (
        <>
          <h1>Sponsor Dashboard</h1>
          <Link to="/Login">
            <button className="submit"> Logout </button>
          </Link>
          <p>
            Welcome back <strong> {user?.username || "Sponsor"}!</strong> This is
            where you can view your catalog and manage products.
          </p>

          <p>
            Organization: <strong>{organization?.name}</strong>
          </p>
          <p>
            Point Value: <strong>${organization?.pointWorth || "N/A"} per point</strong>
          </p>

          {/* Catalog Section */}
          <h2>Your Catalog</h2>
          {catalog.length === 0 ? (
            <p>Your catalog is currently empty. Use the search below to add products!</p>
          ) : (
            <div className="catalog-grid">
              {catalog.map((item) => (
                <ProductCard 
                  key={item.catalogItemId}
                  title={item.title}
                  imageUrl={item.imageUrl}
                  price={item.price}
                  currency={item.currency}
                  points={item.points}
                  condition={item.condition}
                  >
                    <button onClick={() => handleUpdatePoints(item)}>Update Points
                    </button>
                    <button onClick={() => handleRemoveItem(item)}>Remove Item
                    </button>
                  </ProductCard>
              ))}
            </div>
          )}

          <hr style={{margin: "3rem 0"}} />
          {/* Search and Add Products Section */}

          <h2>Search eBay to Add Products</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for products to add to your catalog"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
          </div>

          {searchResults.length > 0 && (
            <div className="search-results-grid">
              {searchResults.map((product) => (
                <ProductCard 
                  key={product.itemId}
                  title={product.name}
                  imageUrl={product.image}
                  price={product.price}
                  currency={product.currency}
                  condition={product.condition}
                  >
                    <button onClick={() => handleAddProduct(product)}>Add to Catalog</button>
                  </ProductCard>
              ))}
            </div>
          )}

          <h2>Manage Sponsor Orgs and other Sponsors</h2>
          <p>
            Register a Sponsor <Link to="/SponsorSignUp">Create one Here</Link>
          </p>
        </>
      )}
    </div>
  );
}

export default SponsorDashboard;
