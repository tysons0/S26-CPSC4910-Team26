import { useEffect, useState, Fragment } from "react";
import apiService from "../../services/api";
import PageTitle from "../../components/PageTitle";
import { useNavigate } from "react-router-dom";
import "../../css/AdminDashboard.css";
import { useImpersonation } from "../../hooks/useImpersonation";

function AdminViewDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("driverId-asc");

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

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState("");

  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState({});

  const { impersonate } = useImpersonation();

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const userRole = apiService.getUserRole();
        if (userRole?.toLowerCase() !== "admin") {
          navigate("/About");
          return;
        }

        const data = await apiService.getDrivers();
        console.log("Drivers data:", data);
        setDrivers(Array.isArray(data) ? data : []);

        const orgData = await apiService.getOrganizations();
        setOrgs(Array.isArray(orgData) ? orgData : []);
      } catch (err) {
        console.error("Error fetching drivers:", err);
        setError(err.message || "Failed to load drivers");
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  const handleImpersonateDriver = async (driver) => {
    await impersonate({
      userId: driver.userData.id,
      username: driver.userData.username,
      role: "driver",
      targetPath: "/DriverDashboard",
    });
  };

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

  const handleEnableDriver = async (driver) => {
    const userId = driver.userData?.id;

    if (!userId) {
      alert("Could not find user ID for this driver.");
      return;
    }

    if (!driver.userData?.disabled) {
      alert("This driver is already active.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to enable ${driver.userData?.username || "this driver"}?`,
    );

    if (!confirmed) return;

    try {
      await apiService.enableUser(userId);

      setDrivers((prevDrivers) =>
        prevDrivers.map((d) =>
          d.driverId === driver.driverId
            ? {
                ...d,
                userData: {
                  ...d.userData,
                  disabled: false,
                },
              }
            : d,
        ),
      );

      alert("Driver enabled successfully.");
    } catch (error) {
      console.error("Error enabling driver:", error);
      alert("Failed to enable driver: " + (error.message || "Unknown error"));
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

  const handleAddToOrg = async (driver) => {
    const orgId = selectedOrgId[driver.driverId];
    if (!orgId) return;

    const org = orgs.find((o) => String(o.orgId) === String(orgId));
    const confirmed = window.confirm(
      `Add ${driver.userData?.username} to ${org?.name}?`,
    );
    if (!confirmed) return;

    try {
      await apiService.orgAddDriver(driver.driverId, orgId);
      alert(`Driver added to ${org?.name} successfully.`);
      // Refresh drivers to reflect updated driverOrgsAndPoints
      const data = await apiService.getDrivers();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (error) {
      alert("Failed to add driver: " + (error.message || "Unknown error"));
    }
  };

  const handleRemoveFromOrg = async (driver, orgId) => {
    const org = orgs.find((o) => String(o.orgId) === String(orgId));
    const confirmed = window.confirm(
      `Remove ${driver.userData?.username} from ${org?.name}?`,
    );
    if (!confirmed) return;

    try {
      await apiService.leaveOrganization(driver.driverId, orgId);
      alert(`Driver removed from ${org?.name} successfully.`);
      const data = await apiService.getDrivers();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (error) {
      alert("Failed to remove driver: " + (error.message || "Unknown error"));
    }
  };

  const getDriverOrgs = (driver) => {
    return Array.isArray(driver?.driverOrgsAndPoints)
      ? driver.driverOrgsAndPoints
      : [];
  };

  const getDriverOrgDisplay = (driver) => {
    const orgs = getDriverOrgs(driver);

    if (orgs.length === 0) return "None";

    return orgs
      .map((org) => {
        // adjust these names if your backend uses different property names
        const orgId = org.organizationId ?? org.orgId ?? org.id;
        const orgName = org.organizationName ?? org.name;

        if (orgName) return orgName;
        if (orgId) return `Org ${orgId}`;
        return "Unknown Org";
      })
      .join(", ");
  };

  const getDriverTotalPoints = (driver) => {
    const orgs = getDriverOrgs(driver);

    if (orgs.length === 0) {
      return driver.points || 0;
    }

    return orgs.reduce((sum, org) => {
      const points = org.points ?? org.pointBalance ?? org.currentPoints ?? 0;
      return sum + points;
    }, 0);
  };

  const getFirstOrgSortValue = (driver) => {
    const orgs = getDriverOrgs(driver);
    if (orgs.length === 0) return 0;

    return orgs[0]?.organizationId ?? orgs[0]?.orgId ?? orgs[0]?.id ?? 0;
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

    const usernameA = a.userData?.username || "";
    const usernameB = b.userData?.username || "";

    const emailA = a.userData?.email || "";
    const emailB = b.userData?.email || "";

    const orgA = getFirstOrgSortValue(a);
    const orgB = getFirstOrgSortValue(b);

    const disabledA = a.userData?.disabled ? 1 : 0;
    const disabledB = b.userData?.disabled ? 1 : 0;

    switch (sortBy) {
      case "driverId-asc":
        return (a.driverId || 0) - (b.driverId || 0);
      case "driverId-desc":
        return (b.driverId || 0) - (a.driverId || 0);
      case "name-asc":
        return nameA.localeCompare(nameB);
      case "name-desc":
        return nameB.localeCompare(nameA);
      case "username-asc":
        return usernameA.localeCompare(usernameB);
      case "username-desc":
        return usernameB.localeCompare(usernameA);
      case "email-asc":
        return emailA.localeCompare(emailB);
      case "email-desc":
        return emailB.localeCompare(emailA);
      case "points-desc":
        return getDriverTotalPoints(b) - getDriverTotalPoints(a);
      case "points-asc":
        return getDriverTotalPoints(a) - getDriverTotalPoints(b);
      case "org-asc":
        return orgA - orgB;
      case "org-desc":
        return orgB - orgA;
      case "status-asc":
        return disabledA - disabledB; // active first
      case "status-desc":
        return disabledB - disabledA; // disabled first
      default:
        return 0;
    }
  });

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

      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        <label style={{ fontWeight: 600, color: "var(--text-muted)" }}>
          Sort by:
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="view-select"
          style={{ width: "auto" }}
        >
          <option value="driverId-asc">Driver ID ↑</option>
          <option value="driverId-desc">Driver ID ↓</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="username-asc">Username A–Z</option>
          <option value="username-desc">Username Z–A</option>
          <option value="email-asc">Email A–Z</option>
          <option value="email-desc">Email Z–A</option>
          <option value="points-desc">Points High to Low</option>
          <option value="points-asc">Points Low to High</option>
          <option value="org-asc">Organization Low to High</option>
          <option value="org-desc">Organization High to Low</option>
          <option value="status-asc">Active First</option>
          <option value="status-desc">Disabled First</option>
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

      {uploadResult && (
        <p
          style={{
            color: uploadResult.startsWith("Upload failed")
              ? "#fc8181"
              : "#68d391",
            marginBottom: "0.5rem",
          }}
        >
          {uploadResult}
        </p>
      )}

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
              {sortedDrivers.map((driver, index) => (
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
                      {getDriverTotalPoints(driver)}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        color: "var(--text-alt)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {getDriverOrgDisplay(driver)}
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
                          onClick={() => handleImpersonateDriver(driver)}
                          style={{
                            padding: "0.25rem 0.7rem",
                            background: "rgba(102,126,234,0.12)",
                            color: "#297512",
                            border: "1px solid rgba(102,126,234,0.3)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            transition: "all 0.15s",
                          }}
                        >
                          Impersonate
                        </button>
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
                          onClick={() =>
                            driver.userData?.disabled
                              ? handleEnableDriver(driver)
                              : handleDisableDriver(driver)
                          }
                          style={{
                            padding: "0.25rem 0.7rem",
                            background: driver.userData?.disabled
                              ? "rgba(72,187,120,0.12)"
                              : "rgba(231,76,60,0.1)",
                            color: driver.userData?.disabled
                              ? "#276749"
                              : "#c0392b",
                            border: driver.userData?.disabled
                              ? "1px solid rgba(72,187,120,0.3)"
                              : "1px solid rgba(231,76,60,0.25)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            transition: "all 0.15s",
                          }}
                        >
                          {driver.userData?.disabled ? "Enable" : "Disable"}
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
                                    value: getDriverTotalPoints(driver),
                                  },
                                  {
                                    label: "Organization(s)",
                                    value: getDriverOrgDisplay(driver),
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

                              {/* Manage Organizations */}
                              <h3
                                style={{
                                  marginBottom: "0.75rem",
                                  color: "var(--text-muted)",
                                  marginTop: "0.5rem",
                                }}
                              >
                                Organizations
                              </h3>

                              {driver.driverOrgsAndPoints?.length > 0 ? (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.5rem",
                                    marginBottom: "1rem",
                                  }}
                                >
                                  {driver.driverOrgsAndPoints.map((entry) => {
                                    const org = orgs.find(
                                      (o) =>
                                        String(o.orgId) === String(entry.orgId),
                                    );
                                    return (
                                      <div
                                        key={entry.orgId}
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          background: "var(--bg)",
                                          border: "1px solid var(--border)",
                                          borderRadius: "8px",
                                          padding: "0.5rem 0.75rem",
                                          fontSize: "0.9rem",
                                        }}
                                      >
                                        <span
                                          style={{
                                            color: "var(--text-muted)",
                                            fontWeight: 600,
                                          }}
                                        >
                                          🏢{" "}
                                          {org?.name || `Org #${entry.orgId}`}
                                        </span>
                                        <button
                                          onClick={() =>
                                            handleRemoveFromOrg(
                                              driver,
                                              entry.orgId,
                                            )
                                          }
                                          style={{
                                            padding: "0.3rem 0.75rem",
                                            background:
                                              "rgba(252,129,129,0.12)",
                                            color: "#fc8181",
                                            border:
                                              "1px solid rgba(252,129,129,0.3)",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontSize: "0.8rem",
                                            fontWeight: 600,
                                          }}
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p
                                  style={{
                                    color: "var(--text-alt)",
                                    fontSize: "0.9rem",
                                    marginBottom: "1rem",
                                  }}
                                >
                                  Not a member of any organization.
                                </p>
                              )}

                              <div
                                style={{
                                  display: "flex",
                                  gap: "0.5rem",
                                  alignItems: "center",
                                  marginBottom: "1.5rem",
                                }}
                              >
                                <select
                                  className="view-select"
                                  style={{ width: "auto", flex: 1 }}
                                  value={selectedOrgId[driver.driverId] || ""}
                                  onChange={(e) =>
                                    setSelectedOrgId((prev) => ({
                                      ...prev,
                                      [driver.driverId]: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="">
                                    Select organization to add...
                                  </option>
                                  {orgs
                                    .filter(
                                      (o) =>
                                        !driver.driverOrgsAndPoints?.some(
                                          (entry) =>
                                            String(entry.orgId) ===
                                            String(o.orgId),
                                        ),
                                    )
                                    .map((o) => (
                                      <option key={o.orgId} value={o.orgId}>
                                        {o.name}
                                      </option>
                                    ))}
                                </select>
                                <button
                                  onClick={() => handleAddToOrg(driver)}
                                  disabled={!selectedOrgId[driver.driverId]}
                                  style={{
                                    padding: "0.5rem 1rem",
                                    background: "rgba(102,126,234,0.12)",
                                    color: "#667eea",
                                    border: "1px solid rgba(102,126,234,0.3)",
                                    borderRadius: "7px",
                                    cursor: selectedOrgId[driver.driverId]
                                      ? "pointer"
                                      : "not-allowed",
                                    fontWeight: 600,
                                    fontSize: "0.875rem",
                                    opacity: selectedOrgId[driver.driverId]
                                      ? 1
                                      : 0.5,
                                  }}
                                >
                                  Add to Org
                                </button>
                              </div>

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
                                Current Balance: {getDriverTotalPoints(driver)}{" "}
                                Points
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
