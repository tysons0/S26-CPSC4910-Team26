// pages/SponsorOrderHistory.jsx
import { useEffect, useState } from "react";
import apiService from "../../services/api";
import PageTitle from "../../components/PageTitle";
import { useNavigate, useParams } from "react-router-dom";

const SponsorOrderHistory = () => {
  const { orgId } = useParams();
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [groupedOrders, setGroupedOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("date_desc");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await apiService.getOrdersByOrgId(orgId);
        const drivers = await apiService.getOrganizationDrivers(orgId);
        setOrders(data);
        setDrivers(drivers);
        console.log("Fetched organization orders:", data);


        const groupedOrders = groupOrdersByDriver(data, drivers);
        setGroupedOrders(groupedOrders);
        console.log("Organization drivers:", drivers);
      } catch (err) {
        console.error("Error fetching organization orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [orgId]);

  const groupOrdersByDriver = (orders, drivers = []) => {
    const driverMap = drivers.reduce((map, driver) => {
      map[driver.driverId] = driver.userData?.firstName || `Driver ${driver.driverId}`;
      return map;
    }, {});
    return orders.reduce((acc, order) => {
      const driverName = driverMap[order.driverId] || `Unknown`;
      if (!acc[driverName]) {
        acc[driverName] = [];
      }
      acc[driverName].push(order);
      return acc;
    }, {});
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === "ALL") return true;
    return order.status === statusFilter;
  });
  
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortOption) {
        case "points-asc":
            return (a.totalPoints || 0) - (b.totalPoints || 0);
        case "points-desc":
            return (b.totalPoints || 0) - (a.totalPoints || 0);
        case "status":
            return a.status.localeCompare(b.status);
        case "date-asc":
            return new Date(a.createdAt) - new Date(b.createdAt);
        case "date-desc":
        default:
            return new Date(b.createdAt) - new Date(a.createdAt);
    }
    });
  const groupedFilteredOrders = groupOrdersByDriver(sortedOrders, drivers);
  

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="catalog-page">
      <PageTitle title="Organization Orders | Team 26" />
      <h1>Organization Order History</h1>

      <div style={{ marginBottom: "1rem", display : "flex", gap: "1rem", alignItems: "center" }}>
        <div>
        <label htmlFor="statusFilter">Filter by Status:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div>
        <label htmlFor="sortOption">Sort by:</label>
          <select
            id="sortOption"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="date_desc">Date (Newest First)</option>
            <option value="date_asc">Date (Oldest First)</option>
            <option value="points_desc">Points (Highest First)</option>
            <option value="points_asc">Points (Lowest First)</option>
            <option value="status">Status</option>
          </select>
        </div>
       </div>

       {Object.keys(groupedFilteredOrders).length === 0 ? (
        <p>No orders found for this organization.</p>
      ) : (
        <div className="catalog-list">
          {Object.entries(groupedFilteredOrders).map(([driverName, driverOrders]) => (
            <div key={driverName} style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ marginBottom: "0.5rem" }}>Driver: {driverName}</h2>
              <ul>
                {driverOrders.map((order) => (
                  <div key={order.orderId} 
                       className="catalog-row" 
                       style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div>
                        <strong>Order # {order.orderId}</strong>
                        <p>Status: {order.status}</p>
                        <p>
                            Date: {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {order.items?.map((item, index) => (
                            <div key={index} style={{ display: "flex", gap: "0.5rem" }}>
                                <p>{item.itemName}</p>
                                <p>Points: {item.pointsAtPurchase}</p>
                            </div>
                        ))}
                    </div>
                    <div>
                        <p>Total Points: {order.totalPoints}</p>
                    </div>
                  </div>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button className="submit" onClick={() => navigate("/SponsorDashboard")}>Back to Dashboard</button>
        </div>

    </div>
  );
};

export default SponsorOrderHistory;