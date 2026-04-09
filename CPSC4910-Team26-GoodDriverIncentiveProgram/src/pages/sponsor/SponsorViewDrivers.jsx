import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/SponsorDashboard.css";
import { useImpersonation } from "../../hooks/useImpersonation";
import PovBanner from "../../components/POVBanner";

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

  const { impersonate } = useImpersonation();

  const [sortBy, setSortBy] = useState("name-asc");

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

  const handleImpersonateDriver = async (driver) => {
    await impersonate({
      userId: driver.userData.id,
      username: driver.userData.username,
      role: "driver",
      targetPath: "/DriverDashboard",
    });
  };

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

  const sortedDrivers = [...drivers].sort((a, b) => {
    const nameA =
      `${a.userData?.firstName || ""} ${a.userData?.lastName || ""}`.trim() ||
      a.userData?.username ||
      "";
    const nameB =
      `${b.userData?.firstName || ""} ${b.userData?.lastName || ""}`.trim() ||
      b.userData?.username ||
      "";

    switch (sortBy) {
      case "name-asc":
        return nameA.localeCompare(nameB);
      case "name-desc":
        return nameB.localeCompare(nameA);
      case "points-desc":
        return (b.points || 0) - (a.points || 0);
      case "points-asc":
        return (a.points || 0) - (b.points || 0);
      case "newest":
        return (
          new Date(b.userData?.createdAtUtc) -
          new Date(a.userData?.createdAtUtc)
        );
      case "oldest":
        return (
          new Date(a.userData?.createdAtUtc) -
          new Date(b.userData?.createdAtUtc)
        );
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="Manage Drivers | Team 26" />
        <h1>Loading drivers...</h1>
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
      <PovBanner />
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

      <h1 style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}>
        Organization Drivers
      </h1>
      <p style={{ color: "var(--text-alt)", marginBottom: "1.5rem" }}>
        View and manage drivers in your organization.
      </p>

      {error && (
        <div
          style={{
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            background: "rgba(231,76,60,0.08)",
            border: "1px solid rgba(231,76,60,0.25)",
            color: "#c0392b",
          }}
        >
          {error}
        </div>
      )}

      {drivers.length === 0 ? (
        <p style={{ color: "var(--text-alt)" }}>
          No drivers in your organization yet.
        </p>
      ) : (
        <div>
          <h2 style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
            Drivers ({drivers.length})
          </h2>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ marginRight: "0.5rem", fontWeight: 600 }}>
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="view-select"
              style={{ width: "auto" }}
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="points-desc">Points High to Low</option>
              <option value="points-asc">Points Low to High</option>
              <option value="newest">Newest Member</option>
              <option value="oldest">Oldest Member</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            {sortedDrivers.map((driver) => (
              <div
                key={driver.driverId}
                style={{
                  background: "var(--surface-alt)",
                  padding: "1.5rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  transition: "background 0.3s, border-color 0.3s",
                }}
              >
                {editingDriver === driver.driverId ? (
                  // EDIT MODE
                  <div>
                    <h3
                      style={{
                        margin: "0 0 1rem 0",
                        color: "var(--text-muted)",
                      }}
                    >
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
                      {[
                        {
                          label: "First Name",
                          name: "firstName",
                          type: "text",
                        },
                        { label: "Last Name", name: "lastName", type: "text" },
                        { label: "Email", name: "email", type: "email" },
                        {
                          label: "Phone Number",
                          name: "phoneNumber",
                          type: "tel",
                        },
                        { label: "Time Zone", name: "timeZone", type: "text" },
                        { label: "Country", name: "country", type: "text" },
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
                  </div>
                ) : (
                  // VIEW MODE
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: "0 0 0.75rem 0",
                          color: "var(--text-muted)",
                        }}
                      >
                        {driver.userData?.firstName && driver.userData?.lastName
                          ? `${driver.userData.firstName} ${driver.userData.lastName}`
                          : driver.userData?.username ||
                            `Driver #${driver.driverId}`}
                      </h3>

                      {[
                        { label: "Username", value: driver.userData?.username },
                        { label: "Email", value: driver.userData?.email },
                        { label: "Phone", value: driver.userData?.phoneNumber },
                        { label: "Driver ID", value: driver.driverId },
                      ]
                        .filter(({ value }) => value)
                        .map(({ label, value }) => (
                          <div
                            key={label}
                            style={{
                              fontSize: "0.9rem",
                              color: "var(--text-alt)",
                              marginBottom: "0.4rem",
                            }}
                          >
                            <strong style={{ color: "var(--text-muted)" }}>
                              {label}:
                            </strong>{" "}
                            {value}
                          </div>
                        ))}

                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "1.1rem",
                          color: "#667eea",
                          marginTop: "0.5rem",
                        }}
                      >
                        <strong>Points:</strong> {driver.points || 0}
                      </div>

                      {driver.addresses?.filter((a) => a.primary).length >
                        0 && (
                        <div style={{ marginTop: "0.75rem" }}>
                          <strong
                            style={{
                              fontSize: "0.9rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            Primary Address:
                          </strong>
                          {driver.addresses
                            .filter((a) => a.primary)
                            .map((addr) => (
                              <div
                                key={addr.addressId}
                                style={{
                                  color: "var(--text-alt)",
                                  fontSize: "0.875rem",
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
                          color: "var(--text-alt)",
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

                    {/* Action buttons */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        flexShrink: 0,
                      }}
                    >
                      <button
                        onClick={() => handleImpersonateDriver(driver)}
                        style={{
                          padding: "0.5rem 1.1rem",
                          background: "rgba(102,126,234,0.12)",
                          color: "#157528",
                          border: "1px solid rgba(102,126,234,0.3)",
                          borderRadius: "7px",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          transition: "all 0.15s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Impersonate
                      </button>
                      <button
                        onClick={() => handleAdjustPoints(driver)}
                        disabled={adjustingDriver === driver.driverId}
                        style={{
                          padding: "0.5rem 1.1rem",
                          background:
                            "linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.15))",
                          color: "#667eea",
                          border: "1px solid rgba(102,126,234,0.3)",
                          borderRadius: "7px",
                          cursor:
                            adjustingDriver === driver.driverId
                              ? "not-allowed"
                              : "pointer",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          opacity:
                            adjustingDriver === driver.driverId ? 0.6 : 1,
                          transition: "all 0.15s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {adjustingDriver === driver.driverId
                          ? "Processing..."
                          : "Adjust Points"}
                      </button>
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
                          whiteSpace: "nowrap",
                        }}
                      >
                        Edit Info
                      </button>
                      <button
                        onClick={() => handleViewPointHistory(driver)}
                        style={{
                          padding: "0.5rem 1.1rem",
                          background: "rgba(72,187,120,0.12)",
                          color: "#276749",
                          border: "1px solid rgba(72,187,120,0.3)",
                          borderRadius: "7px",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          transition: "all 0.15s",
                          whiteSpace: "nowrap",
                        }}
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
      {viewingPointHistory &&
        (() => {
          const driver = drivers.find(
            (d) => d.driverId === viewingPointHistory,
          );
          if (!driver) return null;
          return (
            <div
              style={{
                background: "var(--surface-alt)",
                padding: "2rem",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                marginTop: "1.5rem",
                transition: "background 0.3s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, color: "var(--text-muted)" }}>
                    Point History — {driver.userData?.username}
                  </h2>
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: "#667eea",
                      marginTop: "0.5rem",
                    }}
                  >
                    Current Balance: {driver.points || 0} pts
                  </div>
                </div>
                <button
                  onClick={handleClosePointHistory}
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

              {loadingHistory ? (
                <p style={{ color: "var(--text-alt)" }}>
                  Loading point history...
                </p>
              ) : pointHistory.length === 0 ? (
                <div
                  style={{
                    background: "var(--bg)",
                    padding: "2rem",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ margin: 0, color: "var(--text-alt)" }}>
                    No point history yet.
                  </p>
                  <p
                    style={{
                      margin: "0.5rem 0 0 0",
                      fontSize: "0.9rem",
                      color: "var(--text-alt)",
                    }}
                  >
                    Point changes will appear here when sponsors adjust this
                    driver's points.
                  </p>
                </div>
              ) : (
                <div>
                  <h3
                    style={{ marginBottom: "1rem", color: "var(--text-muted)" }}
                  >
                    Transaction History ({pointHistory.length})
                  </h3>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {pointHistory.map((transaction, index) => {
                      const positive = transaction.pointChange > 0;
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
                                color: positive ? "#276749" : "#c0392b",
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
                                <strong style={{ color: "var(--text-muted)" }}>
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
                                By Sponsor #{transaction.sponsorId}
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
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
}

export default SponsorViewDrivers;
