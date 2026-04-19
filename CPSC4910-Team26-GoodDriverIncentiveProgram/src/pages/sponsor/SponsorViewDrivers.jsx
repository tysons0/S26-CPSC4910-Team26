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

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState("");

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

  const getDriverPointsForOrg = (driver, currentOrgId) => {
    if (!Array.isArray(driver?.driverOrgsAndPoints) || !currentOrgId) return 0;

    const orgEntry = driver.driverOrgsAndPoints.find(
      (entry) =>
        String(entry?.orgId ?? entry?.organizationId ?? entry?.id) ===
        String(currentOrgId),
    );

    return Number(
      orgEntry?.points ??
        orgEntry?.pointBalance ??
        orgEntry?.currentPoints ??
        0,
    );
  };

  const updateDriverPointsForOrg = (driver, currentOrgId, newPoints) => {
    if (!Array.isArray(driver?.driverOrgsAndPoints)) return driver;

    return {
      ...driver,
      driverOrgsAndPoints: driver.driverOrgsAndPoints.map((entry) => {
        const entryOrgId = entry?.orgId ?? entry?.organizationId ?? entry?.id;

        if (String(entryOrgId) !== String(currentOrgId)) {
          return entry;
        }

        if ("points" in entry) {
          return { ...entry, points: newPoints };
        }
        if ("pointBalance" in entry) {
          return { ...entry, pointBalance: newPoints };
        }
        if ("currentPoints" in entry) {
          return { ...entry, currentPoints: newPoints };
        }

        return { ...entry, points: newPoints };
      }),
    };
  };
  const handleAdjustPoints = async (driver) => {
    const pointChangeStr = prompt(
      `Adjust points for ${driver.userData?.username || `Driver #${driver.driverId}`}\n\n` +
        `Current Points: ${getDriverPointsForOrg(driver, orgId)}\n\n` +
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
      if (!orgId) {
        alert("No organization selected for this sponsor.");
        return;
      }

      console.log("Driver orgs:", driver.driverOrgsAndPoints);
      console.log("Using orgId:", orgId);

      const updatedDriver = await apiService.changeDriverPoints(
        driver.driverId,
        orgId,
        pointChange,
        reason || "",
      );

      // Update the driver in the local state with new points
      const updatedPoints = getDriverPointsForOrg(updatedDriver, orgId);

      setDrivers((prevDrivers) =>
        prevDrivers.map((d) =>
          d.driverId === driver.driverId
            ? updateDriverPointsForOrg(d, orgId, updatedPoints)
            : d,
        ),
      );

      alert(
        `Successfully ${pointChange > 0 ? "added" : "removed"} ${Math.abs(pointChange)} points!\n` +
          `New balance: ${getDriverPointsForOrg(updatedDriver, orgId)} points`,
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

  const handleRemoveDriver = async (driver) => {
    const username = driver.userData?.username || `Driver #${driver.driverId}`;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${username} from your organization?`,
    );
    if (!confirmed) return;

    try {
      await apiService.leaveOrganization(driver.driverId, orgId);

      // Remove driver from local state so the UI updates immediately
      setDrivers((prev) => prev.filter((d) => d.driverId !== driver.driverId));

      alert(`${username} has been removed from your organization.`);
    } catch (error) {
      console.error("Error removing driver:", error);
      alert("Failed to remove driver: " + (error.message || "Unknown error"));
    }
  };

  const handleUploadDrivers = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadResult("");

    try {
      const result = await apiService.uploadUsers(file);
      console.log("Upload result:", result); // shows successes/errors/totalLines

      const successCount = result?.successes?.length ?? 0;
      const errors = result?.errors ?? [];

      if (errors.length > 0) {
        setUploadResult(
          `Uploaded ${successCount} driver(s). Errors: ${errors.join(", ")}`,
        );
      } else {
        setUploadResult(`Successfully uploaded ${successCount} driver(s)!`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult("Upload failed: " + (error.message || "Unknown error"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
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
        return (
          getDriverPointsForOrg(b, orgId) - getDriverPointsForOrg(a, orgId)
        );
      case "points-asc":
        return (
          getDriverPointsForOrg(a, orgId) - getDriverPointsForOrg(b, orgId)
        );
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

            {/* Upload Drivers button */}
            <input
              id="upload-drivers-input"
              type="file"
              accept=".txt,.csv,.psv"
              style={{ display: "none" }}
              onChange={handleUploadDrivers}
            />
            <button
              style={{
                marginLeft: "auto",
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                border: "1px solid rgba(102,126,234,0.3)",
                background: "rgba(102,126,234,0.12)",
                color: "#667eea",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: uploading ? "not-allowed" : "pointer",
                opacity: uploading ? 0.6 : 1,
                transition: "all 0.15s",
              }}
              disabled={uploading}
              onClick={() =>
                document.getElementById("upload-drivers-input").click()
              }
              onMouseEnter={(e) => {
                if (!uploading) {
                  e.currentTarget.style.background = "rgba(102,126,234,0.22)";
                  e.currentTarget.style.borderColor = "#667eea";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(102,126,234,0.12)";
                e.currentTarget.style.borderColor = "rgba(102,126,234,0.3)";
              }}
            >
              {uploading ? "Uploading..." : "Upload Drivers"}
            </button>
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
                {viewingPointHistory === driver.driverId && (
                  <div
                    style={{
                      background: "var(--surface-alt)",
                      padding: "1.5rem",
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      marginTop: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                      }}
                    >
                      <h3 style={{ margin: 0 }}>
                        Point History — {driver.userData?.username}
                      </h3>
                      <button onClick={handleClosePointHistory}>Close</button>
                    </div>

                    {loadingHistory ? (
                      <p>Loading...</p>
                    ) : pointHistory.length === 0 ? (
                      <p>No point history.</p>
                    ) : (
                      <div>
                        {pointHistory.map((transaction, index) => {
                          const positive = transaction.pointChange > 0;
                          return (
                            <div key={index}>
                              {positive ? "+" : ""}
                              {transaction.pointChange} pts —{" "}
                              {transaction.reason}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
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
                        <strong>Points:</strong>{" "}
                        {getDriverPointsForOrg(driver, orgId)}
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

                      <button
                        onClick={() => handleRemoveDriver(driver)}
                        style={{
                          padding: "0.5rem 1.1rem",
                          background: "rgba(231,76,60,0.10)",
                          color: "#c0392b",
                          border: "1px solid rgba(231,76,60,0.3)",
                          borderRadius: "7px",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          transition: "all 0.15s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Remove from Org
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SponsorViewDrivers;
