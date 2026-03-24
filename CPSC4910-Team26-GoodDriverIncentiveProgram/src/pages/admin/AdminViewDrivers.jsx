import { useEffect, useState } from "react";
import apiService from "../../services/api";
import PageTitle from "../../components/PageTitle";

function AdminViewDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Editing state
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
  const [viewingDriver, setViewingDriver] = useState(null);

  const [viewingPointHistory, setViewingPointHistory] = useState(null);
  const [pointHistory, setPointHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const data = await apiService.getDrivers();
        console.log("Drivers data:", data); // DEBUG
        setDrivers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching drivers:", err);
        setError(err.message || "Failed to load drivers");
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  // Handle view driver details
  const handleViewDriver = (driver) => {
    setViewingDriver(driver.driverId);
    setEditingDriver(null);
  };

  // Handle edit button click
  const handleEditDriver = (driver) => {
    setEditingDriver(driver.driverId);
    setViewingDriver(null);
    setEditFormData({
      firstName: driver.userData?.firstName || "",
      lastName: driver.userData?.lastName || "",
      email: driver.userData?.email || "",
      phoneNumber: driver.userData?.phoneNumber || "",
      timeZone: driver.userData?.timeZone || "",
      country: driver.userData?.country || "",
    });
  };

  // Handle form input changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Save driver updates
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

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingDriver(null);
    setViewingDriver(null);
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
        <PageTitle title="View Drivers | Admin" />
        <h1>Loading drivers...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="View Drivers | Admin" />
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="View Drivers | Admin" />
      <h1>Registered Drivers</h1>

      {drivers.length === 0 ? (
        <p>No drivers found.</p>
      ) : (
        <div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "2rem",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#f8f9fa",
                  borderBottom: "2px solid #dee2e6",
                }}
              >
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Driver ID
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Name</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Username
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Email</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Points
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Organization
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver, index) => (
                <tr
                  key={driver.driverId || index}
                  style={{ borderBottom: "1px solid #dee2e6" }}
                >
                  <td style={{ padding: "0.75rem" }}>
                    {driver.driverId || "N/A"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {driver.userData?.firstName && driver.userData?.lastName
                      ? `${driver.userData.firstName} ${driver.userData.lastName}`
                      : driver.userData?.username || "N/A"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {driver.userData?.username || "N/A"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {driver.userData?.email || "N/A"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>{driver.points || 0}</td>
                  <td style={{ padding: "0.75rem" }}>
                    {driver.organizationId
                      ? `Org ${driver.organizationId}`
                      : "None"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <button
                      onClick={() => handleViewDriver(driver)}
                      style={{
                        padding: "0.25rem 0.75rem",
                        marginRight: "0.5rem",
                        backgroundColor: "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleEditDriver(driver)}
                      style={{
                        padding: "0.25rem 0.75rem",
                        backgroundColor: "#667eea",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Driver Details/Edit Panel */}
          {(viewingDriver || editingDriver) && (
            <div
              style={{
                backgroundColor: "#fff",
                padding: "2rem",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "1px solid #e0e0e0",
              }}
            >
              {(() => {
                const driver = drivers.find(
                  (d) => d.driverId === (viewingDriver || editingDriver),
                );
                if (!driver) return null;

                return editingDriver ? (
                  // EDITING MODE
                  <div>
                    <h2 style={{ margin: "0 0 1.5rem 0" }}>
                      Edit Driver Information - {driver.userData?.username}
                    </h2>

                    <div
                      style={{
                        display: "grid",
                        gap: "1rem",
                        gridTemplateColumns: "1fr 1fr",
                        marginBottom: "1.5rem",
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
                          padding: "0.5rem 1.5rem",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: saving ? "not-allowed" : "pointer",
                          fontWeight: "500",
                        }}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        style={{
                          padding: "0.5rem 1.5rem",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: saving ? "not-allowed" : "pointer",
                          fontWeight: "500",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // VIEW MODE
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <h2 style={{ margin: 0 }}>
                        Driver Details - {driver.userData?.username}
                      </h2>
                      <button
                        onClick={handleCancelEdit}
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

                    <div
                      style={{
                        display: "grid",
                        gap: "1rem",
                        gridTemplateColumns: "1fr 1fr",
                      }}
                    >
                      <div>
                        <strong>Driver ID:</strong> {driver.driverId}
                      </div>
                      <div>
                        <strong>User ID:</strong> {driver.userData?.id}
                      </div>
                      <div>
                        <strong>Username:</strong>{" "}
                        {driver.userData?.username || "N/A"}
                      </div>
                      <div>
                        <strong>Full Name:</strong>{" "}
                        {driver.userData?.firstName && driver.userData?.lastName
                          ? `${driver.userData.firstName} ${driver.userData.lastName}`
                          : "N/A"}
                      </div>
                      <div>
                        <strong>Email:</strong>{" "}
                        {driver.userData?.email || "N/A"}
                      </div>
                      <div>
                        <strong>Phone:</strong>{" "}
                        {driver.userData?.phoneNumber || "N/A"}
                      </div>
                      <div>
                        <strong>Time Zone:</strong>{" "}
                        {driver.userData?.timeZone || "N/A"}
                      </div>
                      <div>
                        <strong>Country:</strong>{" "}
                        {driver.userData?.country || "N/A"}
                      </div>
                      <div>
                        <strong>Points:</strong> {driver.points || 0}
                      </div>
                      <div>
                        <strong>Organization:</strong>{" "}
                        {driver.organizationId
                          ? `Org ${driver.organizationId}`
                          : "None"}
                      </div>
                      <div>
                        <strong>Member Since:</strong>{" "}
                        {new Date(
                          driver.userData?.createdAtUtc,
                        ).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Last Login:</strong>{" "}
                        {driver.userData?.lastLoginUtc
                          ? new Date(
                              driver.userData.lastLoginUtc,
                            ).toLocaleString()
                          : "Never"}
                      </div>
                    </div>

                    {driver.addresses && driver.addresses.length > 0 && (
                      <div style={{ marginTop: "1.5rem" }}>
                        <h3 style={{ marginBottom: "0.75rem" }}>Addresses</h3>
                        {driver.addresses.map((addr, idx) => (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: "#f8f9fa",
                              padding: "1rem",
                              borderRadius: "4px",
                              marginBottom: "0.5rem",
                              borderLeft: addr.primary
                                ? "4px solid #667eea"
                                : "none",
                            }}
                          >
                            <strong>{addr.addressAlias}</strong>
                            {addr.primary && (
                              <span
                                style={{
                                  marginLeft: "0.5rem",
                                  padding: "0.25rem 0.5rem",
                                  backgroundColor: "#667eea",
                                  color: "white",
                                  borderRadius: "4px",
                                  fontSize: "0.75rem",
                                }}
                              >
                                Primary
                              </span>
                            )}
                            <div style={{ marginTop: "0.5rem", color: "#666" }}>
                              {addr.addressLine1}
                              {addr.addressLine2 && `, ${addr.addressLine2}`}
                              <br />
                              {addr.city}, {addr.state} {addr.zipCode}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: "1.5rem" }}>
                      <button
                        onClick={() => handleEditDriver(driver)}
                        style={{
                          padding: "0.5rem 1.5rem",
                          backgroundColor: "#667eea",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                      >
                        Edit Driver Info
                      </button>

                      <button
                        onClick={() => handleViewPointHistory(driver)}
                        style={{
                          padding: "0.5rem 1.5rem",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                      >
                        View Point History
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
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

export default AdminViewDrivers;
