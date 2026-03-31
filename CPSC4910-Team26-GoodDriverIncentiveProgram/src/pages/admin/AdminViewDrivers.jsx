import { useEffect, useState, Fragment } from "react";
import apiService from "../../services/api";
import PageTitle from "../../components/PageTitle";
import { useNavigate } from "react-router-dom";
import "../../css/AdminDashboard.css";

function AdminViewDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

  const [pointHistory, setPointHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyDriverId, setHistoryDriverId] = useState(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const userRole = apiService.getUserRole();
        if (userRole?.toLowerCase() !== "admin") {
          navigate("/About");
          return;
        }

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
  const handleViewDriver = async (driver) => {
    if (viewingDriver === driver.driverId) {
      setViewingDriver(null);
      setEditingDriver(null);
      setPointHistory([]);
      setHistoryDriverId(null);
      setLoadingHistory(false);
      return;
    }

    setViewingDriver(driver.driverId);
    setEditingDriver(null);
    setPointHistory([]);
    setHistoryDriverId(driver.driverId);
    setLoadingHistory(true);

    try {
      const history = await apiService.getDriverPointHistory(driver.driverId);

      const sortedHistory = (Array.isArray(history) ? history : []).sort(
        (a, b) => new Date(b.createdAtUtc) - new Date(a.createdAtUtc),
      );

      setPointHistory(sortedHistory);
    } catch (error) {
      console.error("Error fetching point history:", error);
      setPointHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle edit button click
  const handleEditDriver = (driver) => {
    setEditingDriver(driver.driverId);
    setViewingDriver(null);
    setPointHistory([]);
    setHistoryDriverId(null);
    setLoadingHistory(false);

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

  const handleDisableDriver = async (driver) => {
    const userId = driver.userData?.id;

    if (!userId) {
      alert("Could not find user ID for this driver.");
      return;
    }

    if (driver.userData?.disabled) {
      alert("This driver is already disabled.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to disable ${driver.userData?.username || "this driver"}?`,
    );

    if (!confirmed) return;

    try {
      await apiService.disableUser(userId);

      setDrivers((prevDrivers) =>
        prevDrivers.map((d) =>
          d.driverId === driver.driverId
            ? {
                ...d,
                userData: {
                  ...d.userData,
                  disabled: true,
                },
              }
            : d,
        ),
      );

      alert("Driver disabled successfully.");
    } catch (error) {
      console.error("Error disabling driver:", error);
      alert("Failed to disable driver: " + (error.message || "Unknown error"));
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingDriver(null);
    setViewingDriver(null);
    setPointHistory([]);
    setHistoryDriverId(null);
    setLoadingHistory(false);

    setEditFormData({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      timeZone: "",
      country: "",
    });
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
    <div
      style={{
        padding: "2rem",
        background: "var(--bg)",
        minHeight: "100vh",
        color: "var(--text-muted)",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <PageTitle title="View Drivers | Admin" />

      <header className="catalog-header">
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="submit"
            onClick={() => navigate("/AdminDashboard")}
          >
            Back
          </button>
        </div>
      </header>

      <h1 style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
        Registered Drivers
      </h1>

      {drivers.length === 0 ? (
        <p style={{ color: "var(--text-alt)" }}>No drivers found.</p>
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
                  background: "var(--surface-alt)",
                  borderBottom: "2px solid var(--border)",
                }}
              >
                {[
                  "Driver ID",
                  "Name",
                  "Username",
                  "Email",
                  "Points",
                  "Organization",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      color: "var(--text-muted)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver, index) => (
                <Fragment key={driver.driverId || index}>
                  {/* Main row */}
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--surface-alt)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        padding: "0.75rem",
                        color: "var(--text-alt)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {driver.driverId || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        color: "var(--text-muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {driver.userData?.firstName && driver.userData?.lastName
                        ? `${driver.userData.firstName} ${driver.userData.lastName}`
                        : driver.userData?.username || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        color: "var(--text-muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {driver.userData?.username || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        color: "var(--text-muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {driver.userData?.email || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        fontWeight: 600,
                        color: "#667eea",
                        fontSize: "0.875rem",
                      }}
                    >
                      {driver.points || 0}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        color: "var(--text-alt)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {driver.organizationId
                        ? `Org ${driver.organizationId}`
                        : "None"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "12px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          background: driver.userData?.disabled
                            ? "rgba(231,76,60,0.1)"
                            : "rgba(72,187,120,0.12)",
                          color: driver.userData?.disabled
                            ? "#c0392b"
                            : "#276749",
                          border: `1px solid ${driver.userData?.disabled ? "rgba(231,76,60,0.25)" : "rgba(72,187,120,0.3)"}`,
                        }}
                      >
                        {driver.userData?.disabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.4rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={() => handleViewDriver(driver)}
                          style={{
                            padding: "0.25rem 0.7rem",
                            background: "rgba(102,126,234,0.12)",
                            color: "#667eea",
                            border: "1px solid rgba(102,126,234,0.3)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            transition: "all 0.15s",
                          }}
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleEditDriver(driver)}
                          style={{
                            padding: "0.25rem 0.7rem",
                            background: "rgba(102,126,234,0.12)",
                            color: "#667eea",
                            border: "1px solid rgba(102,126,234,0.3)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            transition: "all 0.15s",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDisableDriver(driver)}
                          style={{
                            padding: "0.25rem 0.7rem",
                            background: "rgba(231,76,60,0.1)",
                            color: "#c0392b",
                            border: "1px solid rgba(231,76,60,0.25)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            transition: "all 0.15s",
                          }}
                        >
                          Disable
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {(viewingDriver === driver.driverId ||
                    editingDriver === driver.driverId) && (
                    <tr>
                      <td
                        colSpan="8"
                        style={{
                          padding: "1rem",
                          background: "var(--bg)",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            background: "var(--surface-alt)",
                            padding: "1.5rem",
                            borderRadius: "10px",
                            border: "1px solid var(--border)",
                            transition: "background 0.3s",
                          }}
                        >
                          {editingDriver === driver.driverId ? (
                            // EDIT MODE
                            <>
                              <h2
                                style={{
                                  marginTop: 0,
                                  marginBottom: "1.25rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                Edit Driver — {driver.userData?.username}
                              </h2>
                              <div
                                style={{
                                  display: "grid",
                                  gap: "1rem",
                                  gridTemplateColumns: "1fr 1fr",
                                  marginBottom: "1.25rem",
                                }}
                              >
                                {[
                                  {
                                    label: "First Name",
                                    name: "firstName",
                                    type: "text",
                                  },
                                  {
                                    label: "Last Name",
                                    name: "lastName",
                                    type: "text",
                                  },
                                  {
                                    label: "Email",
                                    name: "email",
                                    type: "email",
                                  },
                                  {
                                    label: "Phone Number",
                                    name: "phoneNumber",
                                    type: "tel",
                                  },
                                  {
                                    label: "Time Zone",
                                    name: "timeZone",
                                    type: "text",
                                  },
                                  {
                                    label: "Country",
                                    name: "country",
                                    type: "text",
                                  },
                                ].map(({ label, name, type }) => (
                                  <div key={name}>
                                    <label
                                      style={{
                                        display: "block",
                                        marginBottom: "0.25rem",
                                        fontWeight: 600,
                                        fontSize: "0.8rem",
                                        color: "var(--text-alt)",
                                      }}
                                    >
                                      {label}
                                    </label>
                                    <input
                                      type={type}
                                      name={name}
                                      value={editFormData[name]}
                                      onChange={handleEditChange}
                                      className="view-select"
                                    />
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                  onClick={() => handleSaveDriver(driver)}
                                  disabled={saving}
                                  style={{
                                    padding: "0.5rem 1.1rem",
                                    background: "rgba(72,187,120,0.15)",
                                    color: "#276749",
                                    border: "1px solid rgba(72,187,120,0.4)",
                                    borderRadius: "7px",
                                    cursor: saving ? "not-allowed" : "pointer",
                                    fontWeight: 600,
                                    fontSize: "0.875rem",
                                    opacity: saving ? 0.6 : 1,
                                    transition: "all 0.15s",
                                  }}
                                >
                                  {saving ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={saving}
                                  style={{
                                    padding: "0.5rem 1.1rem",
                                    background: "transparent",
                                    color: "var(--text-muted)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "7px",
                                    cursor: saving ? "not-allowed" : "pointer",
                                    fontWeight: 600,
                                    fontSize: "0.875rem",
                                    opacity: saving ? 0.6 : 1,
                                    transition: "all 0.15s",
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            // VIEW MODE
                            <>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  marginBottom: "1.25rem",
                                }}
                              >
                                <h2
                                  style={{
                                    margin: 0,
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  Driver Details — {driver.userData?.username}
                                </h2>
                                <button
                                  onClick={handleCancelEdit}
                                  style={{
                                    padding: "0.5rem 1.1rem",
                                    background: "transparent",
                                    color: "var(--text-muted)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "7px",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    fontSize: "0.875rem",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  Close
                                </button>
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gap: "0.75rem",
                                  gridTemplateColumns: "1fr 1fr",
                                  marginBottom: "1.25rem",
                                }}
                              >
                                {[
                                  {
                                    label: "Driver ID",
                                    value: driver.driverId,
                                  },
                                  {
                                    label: "User ID",
                                    value: driver.userData?.id,
                                  },
                                  {
                                    label: "Username",
                                    value: driver.userData?.username || "N/A",
                                  },
                                  {
                                    label: "Full Name",
                                    value:
                                      driver.userData?.firstName &&
                                      driver.userData?.lastName
                                        ? `${driver.userData.firstName} ${driver.userData.lastName}`
                                        : "N/A",
                                  },
                                  {
                                    label: "Email",
                                    value: driver.userData?.email || "N/A",
                                  },
                                  {
                                    label: "Phone",
                                    value:
                                      driver.userData?.phoneNumber || "N/A",
                                  },
                                  {
                                    label: "Time Zone",
                                    value: driver.userData?.timeZone || "N/A",
                                  },
                                  {
                                    label: "Country",
                                    value: driver.userData?.country || "N/A",
                                  },
                                  {
                                    label: "Points",
                                    value: driver.points || 0,
                                  },
                                  {
                                    label: "Organization",
                                    value: driver.organizationId
                                      ? `Org ${driver.organizationId}`
                                      : "None",
                                  },
                                  {
                                    label: "Status",
                                    value: driver.userData?.disabled
                                      ? "Disabled"
                                      : "Active",
                                  },
                                ].map(({ label, value }) => (
                                  <div
                                    key={label}
                                    style={{
                                      fontSize: "0.9rem",
                                      color: "var(--text-alt)",
                                    }}
                                  >
                                    <strong
                                      style={{ color: "var(--text-muted)" }}
                                    >
                                      {label}:
                                    </strong>{" "}
                                    {value}
                                  </div>
                                ))}
                              </div>

                              <button
                                onClick={() => handleEditDriver(driver)}
                                style={{
                                  padding: "0.5rem 1.1rem",
                                  background: "rgba(102,126,234,0.12)",
                                  color: "#667eea",
                                  border: "1px solid rgba(102,126,234,0.3)",
                                  borderRadius: "7px",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  fontSize: "0.875rem",
                                  transition: "all 0.15s",
                                  marginBottom: "1.5rem",
                                }}
                              >
                                Edit Driver Info
                              </button>

                              {/* Point History */}
                              <h3
                                style={{
                                  marginBottom: "0.75rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                Point History
                              </h3>
                              <div
                                style={{
                                  fontSize: "1.25rem",
                                  fontWeight: 700,
                                  color: "#667eea",
                                  marginBottom: "1rem",
                                }}
                              >
                                Current Balance: {driver.points || 0} Points
                              </div>

                              {loadingHistory &&
                              historyDriverId === driver.driverId ? (
                                <p style={{ color: "var(--text-alt)" }}>
                                  Loading point history...
                                </p>
                              ) : historyDriverId === driver.driverId &&
                                pointHistory.length === 0 ? (
                                <div
                                  style={{
                                    background: "var(--bg)",
                                    padding: "1rem",
                                    borderRadius: "8px",
                                    color: "var(--text-alt)",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  No point history yet.
                                </div>
                              ) : historyDriverId === driver.driverId ? (
                                <>
                                  <h4
                                    style={{
                                      marginBottom: "1rem",
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    Transaction History ({pointHistory.length})
                                  </h4>
                                  <div
                                    style={{ display: "grid", gap: "0.75rem" }}
                                  >
                                    {pointHistory.map((transaction, index) => {
                                      const positive =
                                        transaction.pointChange > 0;
                                      return (
                                        <div
                                          key={index}
                                          style={{
                                            background: "var(--bg)",
                                            padding: "1rem 1.25rem",
                                            borderRadius: "8px",
                                            border: "1px solid var(--border)",
                                            borderLeft: `4px solid ${positive ? "#68d391" : "#fc8181"}`,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: "1rem",
                                            transition: "background 0.3s",
                                          }}
                                        >
                                          <div>
                                            <div
                                              style={{
                                                fontSize: "1.1rem",
                                                fontWeight: 700,
                                                color: positive
                                                  ? "#276749"
                                                  : "#c0392b",
                                                marginBottom: "0.25rem",
                                              }}
                                            >
                                              {positive ? "+" : ""}
                                              {transaction.pointChange} Points
                                            </div>
                                            {transaction.reason && (
                                              <div
                                                style={{
                                                  fontSize: "0.875rem",
                                                  color: "var(--text-alt)",
                                                  marginBottom: "0.2rem",
                                                }}
                                              >
                                                <strong
                                                  style={{
                                                    color: "var(--text-muted)",
                                                  }}
                                                >
                                                  Reason:
                                                </strong>{" "}
                                                {transaction.reason}
                                              </div>
                                            )}
                                            {transaction.sponsorId && (
                                              <div
                                                style={{
                                                  fontSize: "0.8rem",
                                                  color: "var(--text-alt)",
                                                }}
                                              >
                                                By Sponsor #
                                                {transaction.sponsorId}
                                              </div>
                                            )}
                                          </div>
                                          <div
                                            style={{
                                              textAlign: "right",
                                              color: "var(--text-alt)",
                                              fontSize: "0.85rem",
                                              flexShrink: 0,
                                            }}
                                          >
                                            {new Date(
                                              transaction.createdAtUtc,
                                            ).toLocaleString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              ) : null}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminViewDrivers;
