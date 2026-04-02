import { use, useEffect, useState } from "react";
import apiService from "../../services/api";
import PageTitle from "../../components/PageTitle";
import { useNavigate } from "react-router-dom";

function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const userData = await apiService.getUserInfo();
                const driver = await apiService.getDriverByUserId(userData.id);
                console.log("OrderHistory driver data: ", driver);
                const orderData = await apiService.getOrders(driver.driverId);
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

    if (loading) {
        return <div>Loading orders...</div>;
    }
    return (
        <div className="catalog-page">
            <PageTitle title="Order History | Team 26" />
            <h1>Your Order History</h1>
            {orders.length === 0 ? (
                <p>You have no past orders.</p>
            ) : (
                <div className="catalog-list">
                    {orders.map((order) => (
                        <div 
                            key={order.orderId} 
                            className="catalog-row"
                            style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
                                <div style={{ marginBottom: "0.25rem" }}>
                                    <strong>Order # {order.orderId}</strong>
                                    <p>Status: {order.status}</p>
                                    <p>
                                        Date: {new Date(order.createdAtUtc).toLocaleDateString()}
                                    </p>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    {order.items?.map((item, index) => (
                                        <div key={index} style={{ display: "flex", gap: "0.5rem" }}>
                                            <p>{item.catalogItemId}</p>
                                            <p>Points: {item.points}</p>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: "0.25rem" }}>
                                    <p>Total Points: {order.totalPoints}</p>
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