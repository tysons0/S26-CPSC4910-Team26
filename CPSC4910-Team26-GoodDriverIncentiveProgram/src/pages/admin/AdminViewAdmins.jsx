import { useEffect, useState, Fragment } from "react";
import apiService from "../../services/api";
import PageTitle from "../../components/PageTitle";
import { useNavigate } from "react-router-dom";

function AdminViewAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Editing state
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    timeZone: "",
    country: "",
  });
  const [saving, setSaving] = useState(false);
  const [viewingAdmin, setViewingAdmin] = useState(null);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const userRole = apiService.getUserRole();
        if (userRole?.toLowerCase() !== "admin") {
          navigate("/About");
          return;
        }

        const data = await apiService.getAdmins();
        console.log("Admins data:", data); // DEBUG
        setAdmins(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching admins:", err);
        setError(err.message || "Failed to load admins");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  // Handle view driver details
  const handleViewAdmin = async (admin) => {
    if (viewingAdmin === admin.adminId) {
      setViewingAdmin(null);
      setEditingAdmin(null);
      return;
    }

    setViewingAdmin(admin.adminId);
    setEditingAdmin(null);
  };

  // Handle edit button click
  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin.adminId);
    setViewingAdmin(null);

    setEditFormData({
      firstName: admin.userData?.firstName || "",
      lastName: admin.userData?.lastName || "",
      email: admin.userData?.email || "",
      phoneNumber: admin.userData?.phoneNumber || "",
      timeZone: admin.userData?.timeZone || "",
      country: admin.userData?.country || "",
    });
  };

  // Handle form input changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Save Admin updates
  const handleSaveAdmin = async (admin) => {
    setSaving(true);

    try {
      const userId = admin.userData.id;
      await apiService.updateUserProfile(userId, editFormData);

      // Update local state
      setAdmins((prevAdmins) =>
        prevAdmins.map((a) =>
          a.adminId === admin.adminId
            ? {
                ...a,
                userData: {
                  ...a.userData,
                  ...editFormData,
                },
              }
            : a,
        ),
      );

      setEditingAdmin(null);
      alert("Admin information updated successfully!");
    } catch (error) {
      console.error("Error updating admin:", error);
      alert("Failed to update admin: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDisableAdmin = async (admin) => {
    const userId = admin.userData?.id;

    if (!userId) {
      alert("Could not find user ID for this admin.");
      return;
    }

    if (admin.userData?.disabled) {
      alert("This admin is already disabled.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to disable ${admin.userData?.username || "this admin"}?`,
    );

    if (!confirmed) return;

    try {
      await apiService.disableUser(userId);

      setAdmins((prevAdmins) =>
        prevAdmins.map((a) =>
          a.adminId === admin.adminId
            ? {
                ...a,
                userData: {
                  ...a.userData,
                  disabled: true,
                },
              }
            : a,
        ),
      );

      alert("Admin disabled successfully.");
    } catch (error) {
      console.error("Error disabling admin:", error);
      alert("Failed to disable admin: " + (error.message || "Unknown error"));
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingAdmin(null);
    setViewingAdmin(null);

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
        <PageTitle title="View Admins | Admin" />
        <h1>Loading Admins...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="View Admins | Admin" />
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
      <PageTitle title="View Admins | Admin" />

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
        Registered Admins
      </h1>

      {admins.length === 0 ? (
        <p style={{ color: "var(--text-alt)" }}>No admins found.</p>
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
                  "Admin ID",
                  "Name",
                  "Username",
                  "Email",
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
              {admins.map((admin, index) => (
                <Fragment key={admin.adminId || index}>
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
                      {admin.adminId || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        color: "var(--text-muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {admin.userData?.firstName && admin.userData?.lastName
                        ? `${admin.userData.firstName} ${admin.userData.lastName}`
                        : admin.userData?.username || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        color: "var(--text-muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {admin.userData?.username || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        color: "var(--text-muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {admin.userData?.email || "N/A"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "12px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          background: admin.userData?.disabled
                            ? "rgba(231,76,60,0.1)"
                            : "rgba(72,187,120,0.12)",
                          color: admin.userData?.disabled
                            ? "#c0392b"
                            : "#276749",
                          border: `1px solid ${admin.userData?.disabled ? "rgba(231,76,60,0.25)" : "rgba(72,187,120,0.3)"}`,
                        }}
                      >
                        {admin.userData?.disabled ? "Disabled" : "Active"}
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
                          onClick={() => handleViewAdmin(admin)}
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
                          onClick={() => handleEditAdmin(admin)}
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
                          onClick={() => handleDisableAdmin(admin)}
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
                  {(viewingAdmin === admin.adminId ||
                    editingAdmin === admin.adminId) && (
                    <tr>
                      <td
                        colSpan="6"
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
                          {editingAdmin === admin.adminId ? (
                            // EDIT MODE
                            <>
                              <h2
                                style={{
                                  marginTop: 0,
                                  marginBottom: "1.25rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                Edit Admin — {admin.userData?.username}
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
                                  onClick={() => handleSaveAdmin(admin)}
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
                                  Admin Details — {admin.userData?.username}
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
                                  { label: "Admin ID", value: admin.adminId },
                                  {
                                    label: "User ID",
                                    value: admin.userData?.id,
                                  },
                                  {
                                    label: "Username",
                                    value: admin.userData?.username || "N/A",
                                  },
                                  {
                                    label: "Full Name",
                                    value:
                                      admin.userData?.firstName &&
                                      admin.userData?.lastName
                                        ? `${admin.userData.firstName} ${admin.userData.lastName}`
                                        : "N/A",
                                  },
                                  {
                                    label: "Email",
                                    value: admin.userData?.email || "N/A",
                                  },
                                  {
                                    label: "Phone",
                                    value: admin.userData?.phoneNumber || "N/A",
                                  },
                                  {
                                    label: "Time Zone",
                                    value: admin.userData?.timeZone || "N/A",
                                  },
                                  {
                                    label: "Country",
                                    value: admin.userData?.country || "N/A",
                                  },
                                  {
                                    label: "Organizations",
                                    value: admin.associatedOrgIds
                                      ? `Orgs ${admin.associatedOrgIds}`
                                      : "None",
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
                                onClick={() => handleEditAdmin(admin)}
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
                                }}
                              >
                                Edit Admin Info
                              </button>
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

export default AdminViewAdmins;
