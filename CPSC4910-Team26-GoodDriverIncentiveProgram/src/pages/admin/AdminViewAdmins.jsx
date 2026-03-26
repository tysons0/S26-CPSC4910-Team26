import { useEffect, useState, Fragment } from "react";
import apiService from "../../services/api";
import PageTitle from "../../components/PageTitle";

function AdminViewAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <div style={{ padding: "2rem" }}>
      <PageTitle title="View Admins | Admin" />
      <h1>Registered Admins</h1>

      {admins.length === 0 ? (
        <p>No admins found.</p>
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
                  Admin ID
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Name</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Username
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Email</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin, index) => (
                <Fragment key={admin.adminId || index}>
                  <tr style={{ borderBottom: "1px solid #dee2e6" }}>
                    <td style={{ padding: "0.75rem" }}>
                      {admin.adminId || "N/A"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {admin.userData?.firstName && admin.userData?.lastName
                        ? `${admin.userData.firstName} ${admin.userData.lastName}`
                        : admin.userData?.username || "N/A"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {admin.userData?.username || "N/A"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {admin.userData?.email || "N/A"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <button
                        onClick={() => handleViewAdmin(admin)}
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
                        onClick={() => handleEditAdmin(admin)}
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

                  {(viewingAdmin === admin.adminId ||
                    editingAdmin === admin.adminId) && (
                    <tr>
                      <td
                        colSpan="7"
                        style={{
                          padding: "1rem",
                          backgroundColor: "#f8f9fa",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        {editingAdmin === admin.adminId ? (
                          <div
                            style={{
                              backgroundColor: "#fff",
                              padding: "1.5rem",
                              borderRadius: "8px",
                              border: "1px solid #ddd",
                            }}
                          >
                            <h2 style={{ marginTop: 0 }}>
                              Edit Admin Information -{" "}
                              {admin.userData?.username}
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
                                onClick={() => handleSaveAdmin(admin)}
                                disabled={saving}
                                style={{
                                  padding: "0.5rem 1.5rem",
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
                                  padding: "0.5rem 1.5rem",
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
                          <div
                            style={{
                              backgroundColor: "#fff",
                              padding: "1.5rem",
                              borderRadius: "8px",
                              border: "1px solid #ddd",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "start",
                                marginBottom: "1rem",
                              }}
                            >
                              <h2 style={{ margin: 0 }}>
                                Admin Details - {admin.userData?.username}
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
                                <strong>Admin ID:</strong> {admin.adminId}
                              </div>
                              <div>
                                <strong>User ID:</strong> {admin.userData?.id}
                              </div>
                              <div>
                                <strong>Username:</strong>{" "}
                                {admin.userData?.username || "N/A"}
                              </div>
                              <div>
                                <strong>Full Name:</strong>{" "}
                                {admin.userData?.firstName &&
                                admin.userData?.lastName
                                  ? `${admin.userData.firstName} ${admin.userData.lastName}`
                                  : "N/A"}
                              </div>
                              <div>
                                <strong>Email:</strong>{" "}
                                {admin.userData?.email || "N/A"}
                              </div>
                              <div>
                                <strong>Phone:</strong>{" "}
                                {admin.userData?.phoneNumber || "N/A"}
                              </div>
                              <div>
                                <strong>Time Zone:</strong>{" "}
                                {admin.userData?.timeZone || "N/A"}
                              </div>
                              <div>
                                <strong>Country:</strong>{" "}
                                {admin.userData?.country || "N/A"}
                              </div>

                              <div>
                                <strong>Organizations:</strong>{" "}
                                {admin.associatedOrgIds
                                  ? `Orgs ${admin.associatedOrgIds}`
                                  : "None"}
                              </div>
                            </div>

                            <div style={{ marginTop: "1rem" }}>
                              <button
                                onClick={() => handleEditAdmin(admin)}
                                style={{
                                  padding: "0.5rem 1.5rem",
                                  backgroundColor: "#667eea",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                }}
                              >
                                Edit Admin Info
                              </button>
                            </div>
                          </div>
                        )}
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
