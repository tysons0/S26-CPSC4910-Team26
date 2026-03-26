import { useEffect, useState, Fragment } from "react";
import apiService from "../../services/api";
import PageTitle from "../../components/PageTitle";

function AdminViewSponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Editing state
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    timeZone: "",
    country: "",
  });
  const [saving, setSaving] = useState(false);
  const [viewingSponsor, setViewingSponsor] = useState(null);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const data = await apiService.getSponsors();
        console.log("Sponsor's data:", data); // DEBUG
        setSponsors(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching sponsors:", err);
        setError(err.message || "Failed to load sponsors");
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  // Handle view sponsor details
  const handleViewSponsor = async (sponsor) => {
    if (viewingSponsor === sponsor.sponsorId) {
      setViewingSponsor(null);
      setEditingSponsor(null);
      return;
    }

    setViewingSponsor(sponsor.sponsorId);
    setEditingSponsor(null);
  };

  // Handle edit button click
  const handleEditSponsor = (sponsor) => {
    setEditingSponsor(sponsor.sponsorId);
    setViewingSponsor(null);

    setEditFormData({
      firstName: sponsor.userData?.firstName || "",
      lastName: sponsor.userData?.lastName || "",
      email: sponsor.userData?.email || "",
      phoneNumber: sponsor.userData?.phoneNumber || "",
      timeZone: sponsor.userData?.timeZone || "",
      country: sponsor.userData?.country || "",
    });
  };

  // Handle form input changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Save Admin updates
  const handleSaveSponsor = async (sponsor) => {
    setSaving(true);

    try {
      const userId = sponsor.userData.id;
      await apiService.updateUserProfile(userId, editFormData);

      // Update local state
      setSponsors((prevSponsors) =>
        prevSponsors.map((s) =>
          s.sponsorId === sponsor.sponsorId
            ? {
                ...s,
                userData: {
                  ...s.userData,
                  ...editFormData,
                },
              }
            : s,
        ),
      );

      setEditingSponsor(null);
      alert("Sponsor information updated successfully!");
    } catch (error) {
      console.error("Error updating sponsor:", error);
      alert("Failed to update sponsor: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingSponsor(null);
    setViewingSponsor(null);

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
        <PageTitle title="View Sponsors | Admin" />
        <h1>Loading Sponsors...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="View Sponsors | Admin" />
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="View Sponsors | Admin" />
      <h1>Registered Sponsors</h1>

      {sponsors.length === 0 ? (
        <p>No sponsors found.</p>
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
                  Sponsor ID
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Name</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Username
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Email</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Organization
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((sponsor, index) => (
                <Fragment key={sponsor.sponsorId || index}>
                  <tr style={{ borderBottom: "1px solid #dee2e6" }}>
                    <td style={{ padding: "0.75rem" }}>
                      {sponsor.sponsorId || "N/A"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {sponsor.userData?.firstName && sponsor.userData?.lastName
                        ? `${sponsor.userData.firstName} ${sponsor.userData.lastName}`
                        : sponsor.userData?.username || "N/A"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {sponsor.userData?.username || "N/A"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {sponsor.userData?.email || "N/A"}
                    </td>

                    <td style={{ padding: "0.75rem" }}>
                      {sponsor.organizationId
                        ? `Org ${sponsor.organizationId}`
                        : "None"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <button
                        onClick={() => handleViewSponsor(sponsor)}
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
                        onClick={() => handleEditSponsor(sponsor)}
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

                  {(viewingSponsor === sponsor.sponsorId ||
                    editingSponsor === sponsor.sponsorId) && (
                    <tr>
                      <td
                        colSpan="7"
                        style={{
                          padding: "1rem",
                          backgroundColor: "#f8f9fa",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        {editingSponsor === sponsor.sponsorId ? (
                          <div
                            style={{
                              backgroundColor: "#fff",
                              padding: "1.5rem",
                              borderRadius: "8px",
                              border: "1px solid #ddd",
                            }}
                          >
                            <h2 style={{ marginTop: 0 }}>
                              Edit Sponsor Information -{" "}
                              {sponsor.userData?.username}
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
                                onClick={() => handleSaveSponsor(sponsor)}
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
                                Sponsor Details - {sponsor.userData?.username}
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
                                <strong>Sponsor ID:</strong> {sponsor.sponsorId}
                              </div>
                              <div>
                                <strong>User ID:</strong> {sponsor.userData?.id}
                              </div>
                              <div>
                                <strong>Username:</strong>{" "}
                                {sponsor.userData?.username || "N/A"}
                              </div>
                              <div>
                                <strong>Full Name:</strong>{" "}
                                {sponsor.userData?.firstName &&
                                sponsor.userData?.lastName
                                  ? `${sponsor.userData.firstName} ${sponsor.userData.lastName}`
                                  : "N/A"}
                              </div>
                              <div>
                                <strong>Email:</strong>{" "}
                                {sponsor.userData?.email || "N/A"}
                              </div>
                              <div>
                                <strong>Phone:</strong>{" "}
                                {sponsor.userData?.phoneNumber || "N/A"}
                              </div>
                              <div>
                                <strong>Time Zone:</strong>{" "}
                                {sponsor.userData?.timeZone || "N/A"}
                              </div>
                              <div>
                                <strong>Country:</strong>{" "}
                                {sponsor.userData?.country || "N/A"}
                              </div>

                              <div>
                                <strong>Organization:</strong>{" "}
                                {sponsor.organizationId
                                  ? `Org ${sponsor.organizationId}`
                                  : "None"}
                              </div>
                            </div>

                            <div style={{ marginTop: "1rem" }}>
                              <button
                                onClick={() => handleEditSponsor(sponsor)}
                                style={{
                                  padding: "0.5rem 1.5rem",
                                  backgroundColor: "#667eea",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                }}
                              >
                                Edit Sponsor Info
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

export default AdminViewSponsors;
