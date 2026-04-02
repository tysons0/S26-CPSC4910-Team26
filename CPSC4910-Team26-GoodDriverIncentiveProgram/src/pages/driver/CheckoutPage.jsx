import { useCart } from "../../context/CartContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
import PageTitle from "../../components/PageTitle";


function CheckoutPage() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [activeOrgId, setActiveOrgId] = useState(null);
    const [driver, setDriver] = useState(null);

    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [newAddress, setNewAddress]= useState({
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        zipCode: "",
        alias: ""
    });

    const { cartItems, clearCart } = useCart();
    const totalPoints = cartItems.reduce((sum, item) => sum + item.points, 0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userData = await apiService.getUserInfo();

                setUser(userData);
                const driverData = await apiService.getDriverByUserId(userData.id);
                setDriver(driverData);
                console.log("Checkout driver data: ", driverData);
                const orgId = driverData.organizationId;
                
                setActiveOrgId(orgId);
                const addressList = await apiService.getDriverAddresses(driverData.driverId);
                console.log("Checkout address data: ", addressList);
                setAddresses(addressList);
                const primary = addressList.find(addr => addr.primary);
                if(primary) {
                    setSelectedAddress(primary.driverAddressId);
                }
            }
            catch (err) {
                console.error("Checkout load error: ", err);
                alert("Failed to load checkout data. Please try again.");
                navigate("/DriverDashboard");
            }
        };
        fetchData();

    }, []);

    const handleCheckout = async() => {
        if (!selectedAddress) {
            alert("Please select a shipping address before checking out.");
            return;
        }
        if (cartItems.length === 0) {
            alert("Your cart is empty.");
            return;
        }
        if (totalPoints > (driver.points)) {
            alert("You do not have enough points to complete this purchase.");
            return;
        }
        try {
            console.log("Checkout payload: ", {
                driverId: driver.driverId,
                orgId: activeOrgId,
                shippingAddressId: selectedAddress,
                items: cartItems.map(item => ({
                    catalogItemId: item.id,
                    quantity: item.quantity
                }))
            })
            const response = await apiService.placeOrder(driver.driverId, activeOrgId, selectedAddress, cartItems);
            console.log("Checkout response: ", response);

            alert("Checkout successful!");
            clearCart();
            navigate("/OrderHistory");
        }
        catch (err) {
            console.error("Checkout failed: ", err);
            alert("Checkout failed. Please try again.");
        }
    };
    const handleAddAddress = async () => {
        try {
            const saved = await apiService.addDriverAddress(driver.driverId, newAddress);
            const updated = await apiService.getDriverAddresses(driver.driverId);
            setAddresses(updated);

            const newest = updated[updated.length - 1];
            setSelectedAddress(newest.addressId);
            setShowNewAddressForm(false);
            setNewAddress({
                addressLine1: "",
                addressLine2: "",
                city: "",
                state: "",
                zipCode: "",
                alias: ""
            })
        }
        catch (err) {
            console.error("Add address failed: ", err);
            alert("Failed to add address. Please try again.");
        }
    };

    return (
        <div className="catalog-page">
            <PageTitle title="Checkout | Team 26" />
            <h1>Checkout</h1>
            {cartItems.length === 0 ? (
                <>
                <p>Your cart is empty.</p>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                    <button className="submit" onClick={() => navigate("/Cart")}>Back to Cart</button>
                    <button className="submit" onClick={() => navigate("/DriverDashboard")}>Continue Shopping</button>
                </div>
                </>
            ) : (
                <>
                <div className="catalog-list">
                    {cartItems.map((item) => (
                        <div className="catalog-row" key={item.id}>
                            <img 
                                src = {item.image} 
                                className="catalog-img"
                                alt={item.name}
                                onError={(e) => {
                                    if (e.target.src !== "https://via.placeholder.com/120?text=No+Image") {
                                        e.target.src = "https://via.placeholder.com/120?text=No+Image";
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
                                <p>Quantity: {item.quantity}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: "1rem" }}>
                    <h2>Total: {totalPoints} Points</h2>
                    {driver && (
                        <p>Your Points: {driver.points}</p>
                    )}
                </div>
            
                {driver && totalPoints > driver.points && (
                    <p style={{ color: "red" }}>You do not have enough points to complete this purchase.</p>
                )}

                <h2 style={{ marginTop: "1rem" }}>Shipping Address</h2>
                {addresses.length === 0 ? (
                    <p>No saved addresses. Please add one in your profile.</p>
                ) : (
                    <div>
                        {addresses.map(addr => (
                            <div key={addr.addressId} style={{ marginBottom: "0.5rem" }}>
                                <input 
                                    type="radio"
                                    name="address"
                                    value={addr.addressId}
                                    checked={selectedAddress === addr.addressId}
                                    onChange={() => setSelectedAddress(addr.addressId)}
                                />
                                <span style={{ marginLeft: "0.5rem" }}>
                                    <strong>{addr.addressAlias || "Address"}</strong> -{" "}
                                    {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}{addr.city}, {addr.state} {addr.zipCode}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    className="submit"
                    onClick={() => setShowNewAddressForm(prev => !prev)}
                    style={{ marginTop: "1rem" }}
                >
                    {showNewAddressForm ? "Cancel" : "Add New Address"}
                </button>
                {showNewAddressForm && (
                    <div style={{ marginTop: "1rem", border: "1px solid #ccc", padding: "1rem" }}>
                        <input
                            placeholder="Address Line 1"
                            value={newAddress.addressLine1}
                            onChange={(e) =>
                                setNewAddress({...newAddress, addressLine1: e.target.value})
                            }
                            />
                        <input
                            placeholder="Address Line 2"
                            value={newAddress.addressLine2}
                            onChange={(e) =>
                                setNewAddress({ ...newAddress, addressLine2: e.target.value})
                            }
                        />
                        <input
                            placeholder="City"
                            value={newAddress.city}
                            onChange={(e) =>
                                setNewAddress({ ...newAddress, city: e.target.value})
                            }
                        />
                        <input
                            placeholder="State"
                            value={newAddress.state}
                            onChange={(e) =>
                                setNewAddress({ ...newAddress, state: e.target.value})
                            }
                        />
                        <input
                            placeholder="Zip Code"
                            value={newAddress.zipCode}
                            onChange={(e) =>
                                setNewAddress({ ...newAddress, zipCode: e.target.value})
                            }
                        />
                        <input
                            placeholder="Alias (e.g. Home, Work)"
                            value={newAddress.alias}
                            onChange={(e) =>
                                setNewAddress({ ...newAddress, alias: e.target.value })
                            }
                        />
                        <button onClick={handleAddAddress} className="submit" style={{ marginTop: "0.5rem" }}>
                            Save Address
                        </button>
                    </div>

                )}

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                    <button className="submit" onClick={() => navigate("/Cart")}>Back to Cart</button>
                    <button className="submit" onClick={() => navigate("/DriverDashboard")}>Continue Shopping</button>
                    <button className="submit" onClick={handleCheckout} disabled={totalPoints > (driver?.points || 0)}>Confirm Purchase</button>
                </div>
                </>
            )}
        </div>
    );
}

export default CheckoutPage;