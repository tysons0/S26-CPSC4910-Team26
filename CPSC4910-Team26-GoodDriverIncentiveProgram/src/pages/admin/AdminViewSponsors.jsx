import { useEffect, useState, Fragment } from "react";
import apiService from "../../services/api";
import PageTitle from "../../components/PageTitle";
import { useNavigate } from "react-router-dom";
import "../../css/AdminDashboard.css";
import { useImpersonation } from "../../hooks/useImpersonation";

function AdminViewSponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("sponsorId-asc");

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

  const { impersonate } = useImpersonation();

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const userRole = apiService.getUserRole();
        if (userRole?.toLowerCase() !== "admin") {
          navigate("/About");
          return;
        }

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

  const handleImpersonateSponsor = async (sponsor) => {
    await impersonate({
      userId: sponsor.userData.id,
      username: sponsor.userData.username,
      role: "sponsor",
      targetPath: "/SponsorDashboard",
    });
  };

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

  const handleDisableSponsor = async (sponsor) => {
    const userId = sponsor.userData?.id;

    if (!userId) {
      alert("Could not find user ID for this sponsor.");
      return;
    }

    if (sponsor.userData?.disabled) {
      alert("This sponsor is already disabled.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to disable ${sponsor.userData?.username || "this sponsor"}?`,
    );

    if (!confirmed) return;

    try {
      await apiService.disableUser(userId);

      setSponsors((prevSponsors) =>
        prevSponsors.map((s) =>
          s.sponsorId === sponsor.sponsorId
            ? {
                ...s,
                userData: {
                  ...s.userData,
                  disabled: true,
                },
              }
            : s,
        ),
      );

      alert("Sponsor disabled successfully.");
    } catch (error) {
      console.error("Error disabling sponsor:", error);
      alert("Failed to disable sponsor: " + (error.message || "Unknown error"));
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

  const sortedSponsors = [...sponsors].sort((a, b) => {
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

    const orgA = a.organizationId || 0;
    const orgB = b.organizationId || 0;

    const disabledA = a.userData?.disabled ? 1 : 0;
    const disabledB = b.userData?.disabled ? 1 : 0;

    switch (sortBy) {
      case "sponsorId-asc":
        return (a.sponsorId || 0) - (b.sponsorId || 0);
      case "sponsorId-desc":
        return (b.sponsorId || 0) - (a.sponsorId || 0);
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
    <div
      style={{
        padding: "2rem",
        background: "var(--bg)",
        minHeight: "100vh",
        color: "var(--text-muted)",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <PageTitle title="View Sponsors | Admin" />

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
        Registered Sponsors
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
          <option value="sponsorId-asc">Sponsor ID ↑</option>
          <option value="sponsorId-desc">Sponsor ID ↓</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="username-asc">Username A–Z</option>
          <option value="username-desc">Username Z–A</option>
          <option value="email-asc">Email A–Z</option>
          <option value="email-desc">Email Z–A</option>
          <option value="org-asc">Organization Low to High</option>
          <option value="org-desc">Organization High to Low</option>
          <option value="status-asc">Active First</option>
          <option value="status-desc">Disabled First</option>
        </select>
      </div>

      {sponsors.length === 0 ? (
        <p style={{ color: "var(--text-alt)" }}>No sponsors found.</p>
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
                  "Sponsor ID",
                  "Name",
                  "Username",
                  "Email",
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
              {sortedSponsors.map((sponsor, index) => (
                <Fragment key={sponsor.sponsorId || index}>
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
                      {sponsor.sponsorId || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        color: "var(--text-muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {sponsor.userData?.firstName && sponsor.userData?.lastName
                        ? `${sponsor.userData.firstName} ${sponsor.userData.lastName}`
                        : sponsor.userData?.username || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        color: "var(--text-muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {sponsor.userData?.username || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        color: "var(--text-muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {sponsor.userData?.email || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        color: "var(--text-alt)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {sponsor.organizationId
                        ? `Org ${sponsor.organizationId}`
                        : "None"}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "12px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          background: sponsor.userData?.disabled
                            ? "rgba(231,76,60,0.1)"
                            : "rgba(72,187,120,0.12)",
                          color: sponsor.userData?.disabled
                            ? "#c0392b"
                            : "#276749",
                          border: `1px solid ${sponsor.userData?.disabled ? "rgba(231,76,60,0.25)" : "rgba(72,187,120,0.3)"}`,
                        }}
                      >
                        {sponsor.userData?.disabled ? "Disabled" : "Active"}
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
                          onClick={() => handleImpersonateSponsor(sponsor)}
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
                          onClick={() => handleViewSponsor(sponsor)}
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
                          onClick={() => handleEditSponsor(sponsor)}
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
                          onClick={() => handleDisableSponsor(sponsor)}
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
                  {(viewingSponsor === sponsor.sponsorId ||
                    editingSponsor === sponsor.sponsorId) && (
                    <tr>
                      <td
                        colSpan="7"
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
                          {editingSponsor === sponsor.sponsorId ? (
                            // EDIT MODE
                            <>
                              <h2
                                style={{
                                  marginTop: 0,
                                  marginBottom: "1.25rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                Edit Sponsor — {sponsor.userData?.username}
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
                                  onClick={() => handleSaveSponsor(sponsor)}
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
                                  Sponsor Details — {sponsor.userData?.username}
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
                                    label: "Sponsor ID",
                                    value: sponsor.sponsorId,
                                  },
                                  {
                                    label: "User ID",
                                    value: sponsor.userData?.id,
                                  },
                                  {
                                    label: "Username",
                                    value: sponsor.userData?.username || "N/A",
                                  },
                                  {
                                    label: "Full Name",
                                    value:
                                      sponsor.userData?.firstName &&
                                      sponsor.userData?.lastName
                                        ? `${sponsor.userData.firstName} ${sponsor.userData.lastName}`
                                        : "N/A",
                                  },
                                  {
                                    label: "Email",
                                    value: sponsor.userData?.email || "N/A",
                                  },
                                  {
                                    label: "Phone",
                                    value:
                                      sponsor.userData?.phoneNumber || "N/A",
                                  },
                                  {
                                    label: "Time Zone",
                                    value: sponsor.userData?.timeZone || "N/A",
                                  },
                                  {
                                    label: "Country",
                                    value: sponsor.userData?.country || "N/A",
                                  },
                                  {
                                    label: "Organization",
                                    value: sponsor.organizationId
                                      ? `Org ${sponsor.organizationId}`
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
                                onClick={() => handleEditSponsor(sponsor)}
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
                                Edit Sponsor Info
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

export default AdminViewSponsors;
