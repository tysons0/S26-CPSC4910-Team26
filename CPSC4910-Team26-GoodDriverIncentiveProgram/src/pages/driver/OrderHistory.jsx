import { useEffect, useState } from "react";
import apiService from "../../services/api";
import PageTitle from "../../components/PageTitle";
import { useNavigate } from "react-router-dom";
import PovBanner from "../../components/POVBanner";

function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [sortOption, setSortOption] = useState("date_desc");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const userData = await apiService.getUserInfo();
                const driver = await apiService.getDriverByUserId(userData.id);
                console.log("OrderHistory driver data: ", driver);
                const orderData = await apiService.getOrdersByDriverId(driver.driverId);
                console.log("Raw order data:", orderData);
                setOrders(orderData);
            } catch (err) {
                console.error("Order load error", err);
            } finally {
                setLoading(false);
            }
        };

    fetchOrders();
  }, []);

    const handleCancelOrder = async (orderId) => {
        try {
            console.log("Cancelling order:", orderId);
            await apiService.updateOrderStatus(orderId, "Cancelled");
            
            setOrders((prev) => 
                prev.map((order) =>
                    order.orderId === orderId ? { ...order, status: "Cancelled" } : order
                )
            );


            const updatedUser = await apiService.getUserInfo();
            localStorage.setItem("user", JSON.stringify(updatedUser));  

            alert("Order cancelled successfully.");
        } catch (err) {
            console.error("Order cancellation error", err);
            alert("Failed to cancel order. Please try again.");
        }
    }

    const sortedOrders = [...orders].sort((a, b) => {
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


    if (loading) {
        return <div>Loading orders...</div>;
    }
    return (
        <div className="catalog-page">
            <PageTitle title="Order History | Team 26" />
            <h1>Your Order History</h1>
            <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="sort">Sort by: </label>
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                >
                    <option value="date-desc">Date (Newest First)</option>
                    <option value="date-asc">Date (Oldest First)</option>
                    <option value="points-desc">Points (Highest First)</option>
                    <option value="points-asc">Points (Lowest First)</option>
                    <option value="status">Status</option>
                </select>
            </div>
            {orders.length === 0 ? (
                <p>You have no past orders.</p>
            ) : (
                <div className="catalog-list">
                    {sortedOrders.map((order) => (
                        <div 
                            key={order.orderId} 
                            className="catalog-row"
                            style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
                                <div style={{ marginBottom: "0.25rem" }}>
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
                                <div style={{ marginTop: "0.25rem" }}>
                                    <p>Total Points: {order.totalPoints}</p>
                                </div>

                                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                                    {order.status === "Pending" && (
                                        <button className="submit" onClick={() => handleCancelOrder(order.orderId)}>
                                            Cancel Order
                                        </button>
                                    )}
                                </div>

                        </div>
                    ))}
                </div>
            )}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button className="submit" onClick={() => navigate("/DriverDashboard")}>Back to Dashboard</button>
            </div>
        </div>
    );
}

export default OrderHistory;
