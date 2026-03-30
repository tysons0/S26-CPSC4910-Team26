import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";

function SponsorViewDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orgId, setOrgId] = useState(null);
  const [adjustingDriver, setAdjustingDriver] = useState(null);

  const [viewingPointHistory, setViewingPointHistory] = useState(null);
  const [pointHistory, setPointHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  //Editing State
  const [editingDriver, setEditingDriver] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    timeZone: "",
    country: "",
  });
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const userRole = apiService.getUserRole();
        if (userRole?.toLowerCase() !== "sponsor") {
          navigate("/About");
          return;
        }

        // Get sponsor's organization ID
        // You'll need to determine how to get this - maybe from user info?
        const sponsorInfo = await apiService.getSponsorInfo();
        const sponsorOrgId = sponsorInfo.organizationId;

        if (!sponsorOrgId) {
          setError("You are not associated with an organization.");
          setLoading(false);
          return;
        }

        setOrgId(sponsorOrgId);

        const orgDrivers =
          await apiService.getOrganizationDrivers(sponsorOrgId);
        console.log("Drivers returned from API:", orgDrivers); // DEBUG
        console.log("Number of drivers:", orgDrivers.length);

        setDrivers(orgDrivers);
      } catch (error) {
        console.error("Error fetching drivers:", error);
        setError("Failed to load drivers");
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, [navigate]);

  const handleAdjustPoints = async (driver) => {
    const pointChangeStr = prompt(
      `Adjust points for ${driver.userData?.username || `Driver #${driver.driverId}`}\n\n` +
        `Current Points: ${driver.points || 0}\n\n` +
        `Enter point change (positive to add, negative to subtract):`,
    );

    if (pointChangeStr === null) return; // User cancelled

    const pointChange = parseInt(pointChangeStr, 10);

    if (isNaN(pointChange)) {
      alert("Please enter a valid number");
      return;
    }

    if (pointChange === 0) {
      alert("Point change must be non-zero");
      return;
    }

    const reason = prompt(
      `${pointChange > 0 ? "Adding" : "Removing"} ${Math.abs(pointChange)} points\n\n` +
        `Optional reason for change:`,
    );

    if (reason === null) return; // User cancelled

    setAdjustingDriver(driver.driverId);

    try {
      const updatedDriver = await apiService.changeDriverPoints(
        driver.driverId,
        pointChange,
        reason || "",
      );

      // Update the driver in the local state with new points
      setDrivers((prevDrivers) =>
        prevDrivers.map((d) =>
          d.driverId === driver.driverId
            ? { ...d, points: updatedDriver.points }
            : d,
        ),
      );

      alert(
        `Successfully ${pointChange > 0 ? "added" : "removed"} ${Math.abs(pointChange)} points!\n` +
          `New balance: ${updatedDriver.points} points`,
      );
    } catch (error) {
      console.error("Error adjusting points:", error);
      alert("Failed to adjust points: " + (error.message || "Unknown error"));
    } finally {
      setAdjustingDriver(null);
    }
  };

  const handleEditDriver = (driver) => {
    setEditingDriver(driver.driverId);
    setEditFormData({
      firstName: driver.userData?.firstName || "",
      lastName: driver.userData?.lastName || "",
      email: driver.userData?.email || "",
      phoneNumber: driver.userData?.phoneNumber || "",
      timeZone: driver.userData?.timeZone || "",
      country: driver.userData?.country || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  //Save Driver edits
  const handleSaveDriver = async (driver) => {
    setSaving(true);

    try {
      const userId = driver.userData.id;
      await apiService.updateUserProfile(userId, editFormData);

      // Update local state
      setDrivers((prevDrivers) =>
        prevDrivers.map((d) =>
          d.driverId === driver.driverId
            ? {
                ...d,
                userData: {
                  ...d.userData,
                  ...editFormData,
                },
              }
            : d,
        ),
      );

      setEditingDriver(null);
      alert("Driver information updated successfully!");
    } catch (error) {
      console.error("Error updating driver:", error);
      alert("Failed to update driver: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingDriver(null);
    setEditFormData({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      timeZone: "",
      country: "",
    });
  };

  const handleViewPointHistory = async (driver) => {
    setViewingPointHistory(driver.driverId);
    setLoadingHistory(true);

    try {
      const history = await apiService.getDriverPointHistory(driver.driverId);

      // Sort by date, newest first
      const sortedHistory = (Array.isArray(history) ? history : []).sort(
        (a, b) => new Date(b.createdAtUtc) - new Date(a.createdAtUtc),
      );

      setPointHistory(sortedHistory);
    } catch (error) {
      console.error("Error fetching point history:", error);
      alert("Failed to load point history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleClosePointHistory = () => {
    setViewingPointHistory(null);
    setPointHistory([]);
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="Manage Drivers | Team 26" />
        <h1>Loading drivers...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="Manage Drivers | Team 26" />

      <header className="catalog-header">
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="submit"
            onClick={() => navigate("/SponsorDashboard")}
          >
            Back
          </button>
        </div>
      </header>

      <h1>Organization Drivers</h1>
      <p>View and manage drivers in your organization.</p>

      {error && (
        <div
          style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {drivers.length === 0 ? (
        <p>No drivers in your organization yet.</p>
      ) : (
        <div>
          <h2>Drivers ({drivers.length})</h2>

          <div style={{ display: "grid", gap: "1rem" }}>
            {drivers.map((driver) => (
              <div
                key={driver.driverId}
                style={{
                  backgroundColor: "#fff",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  border: "1px solid #e0e0e0",
                }}
              >
                {editingDriver === driver.driverId ? (
                  // EDITING MODE
                  <div>
                    <h3 style={{ margin: "0 0 1rem 0" }}>
                      Edit Driver Information
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gap: "1rem",
                        gridTemplateColumns: "1fr 1fr",
                        marginBottom: "1rem",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "0.25rem",
                            fontWeight: "500",
                          }}
                        >
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={editFormData.firstName}
                          onChange={handleEditChange}
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "0.25rem",
                            fontWeight: "500",
                          }}
                        >
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={editFormData.lastName}
                          onChange={handleEditChange}
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "0.25rem",
                            fontWeight: "500",
                          }}
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={editFormData.email}
                          onChange={handleEditChange}
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "0.25rem",
                            fontWeight: "500",
                          }}
                        >
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={editFormData.phoneNumber}
                          onChange={handleEditChange}
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "0.25rem",
                            fontWeight: "500",
                          }}
                        >
                          Time Zone
                        </label>
                        <input
                          type="text"
                          name="timeZone"
                          value={editFormData.timeZone}
                          onChange={handleEditChange}
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "0.25rem",
                            fontWeight: "500",
                          }}
                        >
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={editFormData.country}
                          onChange={handleEditChange}
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleSaveDriver(driver)}
                        disabled={saving}
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: saving ? "not-allowed" : "pointer",
                        }}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: saving ? "not-allowed" : "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // VIEW MODE (existing code)
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 0.5rem 0" }}>
                        {driver.userData?.firstName && driver.userData?.lastName
                          ? `${driver.userData.firstName} ${driver.userData.lastName}`
                          : driver.userData?.username ||
                            `Driver #${driver.driverId}`}
                      </h3>

                      <div style={{ color: "#666", marginBottom: "0.5rem" }}>
                        <strong>Username:</strong> {driver.userData?.username}
                      </div>

                      {driver.userData?.email && (
                        <div style={{ color: "#666", marginBottom: "0.5rem" }}>
                          <strong>Email:</strong> {driver.userData.email}
                        </div>
                      )}

                      {driver.userData?.phoneNumber && (
                        <div style={{ color: "#666", marginBottom: "0.5rem" }}>
                          <strong>Phone:</strong> {driver.userData.phoneNumber}
                        </div>
                      )}

                      <div style={{ color: "#666", marginBottom: "0.5rem" }}>
                        <strong>Driver ID:</strong> {driver.driverId}
                      </div>

                      <div
                        style={{
                          color: "#28a745",
                          fontWeight: "600",
                          fontSize: "1.1rem",
                          marginTop: "0.5rem",
                        }}
                      >
                        <strong>Points:</strong> {driver.points || 0}
                      </div>

                      {driver.addresses && driver.addresses.length > 0 && (
                        <div style={{ marginTop: "0.75rem" }}>
                          <strong>Primary Address:</strong>
                          {driver.addresses
                            .filter((addr) => addr.primary)
                            .map((addr) => (
                              <div
                                key={addr.addressId}
                                style={{
                                  color: "#666",
                                  fontSize: "0.9rem",
                                  marginTop: "0.25rem",
                                }}
                              >
                                {addr.addressLine1}
                                {addr.addressLine2 && `, ${addr.addressLine2}`}
                                <br />
                                {addr.city}, {addr.state} {addr.zipCode}
                              </div>
                            ))}
                        </div>
                      )}

                      <div
                        style={{
                          color: "#999",
                          fontSize: "0.85rem",
                          marginTop: "0.75rem",
                        }}
                      >
                        Member since:{" "}
                        {new Date(
                          driver.userData?.createdAtUtc,
                        ).toLocaleDateString()}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <button
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#667eea",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                        onClick={() => handleAdjustPoints(driver)}
                        disabled={adjustingDriver === driver.driverId}
                      >
                        {adjustingDriver === driver.driverId
                          ? "Processing..."
                          : "Adjust Points"}
                      </button>

                      {/* NEW: Edit Button */}
                      <button
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#17a2b8",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                        onClick={() => handleEditDriver(driver)}
                      >
                        Edit Info
                      </button>

                      <button
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                        onClick={() => handleViewPointHistory(driver)}
                      >
                        Point History
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Point History Panel */}
      {viewingPointHistory && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "2rem",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e0e0e0",
            marginTop: "1rem",
          }}
        >
          {(() => {
            const driver = drivers.find(
              (d) => d.driverId === viewingPointHistory,
            );
            if (!driver) return null;

            return (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0 }}>
                      Point History - {driver.userData?.username}
                    </h2>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "700",
                        color: "#667eea",
                        marginTop: "0.5rem",
                      }}
                    >
                      Current Balance: {driver.points || 0} Points
                    </div>
                  </div>
                  <button
                    onClick={handleClosePointHistory}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>

                {loadingHistory ? (
                  <p>Loading point history...</p>
                ) : pointHistory.length === 0 ? (
                  <div
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: "2rem",
                      borderRadius: "8px",
                      textAlign: "center",
                      color: "#666",
                    }}
                  >
                    <p style={{ margin: 0 }}>No point history yet.</p>
                    <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>
                      Point changes will appear here when sponsors adjust this
                      driver's points.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ marginBottom: "1rem" }}>
                      Transaction History ({pointHistory.length})
                    </h3>

                    <div style={{ display: "grid", gap: "0.75rem" }}>
                      {pointHistory.map((transaction, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: "#fff",
                            padding: "1rem",
                            borderRadius: "8px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            border: "1px solid #e0e0e0",
                            borderLeft: `4px solid ${transaction.pointChange > 0 ? "#28a745" : "#dc3545"}`,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "1.25rem",
                                fontWeight: "600",
                                color:
                                  transaction.pointChange > 0
                                    ? "#28a745"
                                    : "#dc3545",
                                marginBottom: "0.25rem",
                              }}
                            >
                              {transaction.pointChange > 0 ? "+" : ""}
                              {transaction.pointChange} Points
                            </div>

                            {transaction.reason && (
                              <div
                                style={{
                                  color: "#666",
                                  marginBottom: "0.25rem",
                                }}
                              >
                                <strong>Reason:</strong> {transaction.reason}
                              </div>
                            )}

                            {transaction.sponsorId && (
                              <div
                                style={{ color: "#999", fontSize: "0.85rem" }}
                              >
                                By Sponsor #{transaction.sponsorId}
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              textAlign: "right",
                              color: "#999",
                              fontSize: "0.85rem",
                            }}
                          >
                            {new Date(transaction.createdAtUtc).toLocaleString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default SponsorViewDrivers;
