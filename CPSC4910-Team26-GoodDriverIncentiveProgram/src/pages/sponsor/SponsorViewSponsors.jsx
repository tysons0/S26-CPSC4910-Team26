import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/SponsorDashboard.css";

function SponsorViewSponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orgId, setOrgId] = useState(null);
  const [adjustingSponsor, setAdjustingSponsor] = useState(null);

  //Editing State
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

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSponsors = async () => {
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

        const orgSponsors =
          await apiService.getOrganizationSponsors(sponsorOrgId);
        console.log("Sponsors returned from API:", orgSponsors); // DEBUG
        console.log("Number of Sponsors:", orgSponsors.length);

        setSponsors(orgSponsors);
      } catch (error) {
        console.error("Error fetching sponsors:", error);
        setError("Failed to load sponsors");
      } finally {
        setLoading(false);
      }
    };
    fetchSponsors();
  }, [navigate]);

  const handleEditSponsor = (sponsor) => {
    setEditingSponsor(sponsor.sponsorId);
    setEditFormData({
      firstName: sponsor.userData?.firstName || "",
      lastName: sponsor.userData?.lastName || "",
      email: sponsor.userData?.email || "",
      phoneNumber: sponsor.userData?.phoneNumber || "",
      timeZone: sponsor.userData?.timeZone || "",
      country: sponsor.userData?.country || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  //Save Sponsor edits
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

  const handleCancelEdit = () => {
    setEditingSponsor(null);
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
        <PageTitle title="Manage Sponsors | Team 26" />
        <h1>Loading sponsors...</h1>
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
      <PageTitle title="Manage Sponsors | Team 26" />

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
        Organization Sponsors
      </h1>
      <p style={{ color: "var(--text-alt)", marginBottom: "1.5rem" }}>
        View and manage sponsors in your organization.
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

      {sponsors.length === 0 ? (
        <p style={{ color: "var(--text-alt)" }}>
          No sponsors in your organization yet.
        </p>
      ) : (
        <div>
          <h2 style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
            Sponsors ({sponsors.length})
          </h2>

          <div style={{ display: "grid", gap: "1rem" }}>
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.sponsorId}
                style={{
                  background: "var(--surface-alt)",
                  padding: "1.5rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  transition: "background 0.3s, border-color 0.3s",
                }}
              >
                {editingSponsor === sponsor.sponsorId ? (
                  // EDIT MODE
                  <div>
                    <h3
                      style={{
                        margin: "0 0 1rem 0",
                        color: "var(--text-muted)",
                      }}
                    >
                      Edit Sponsor Information
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
                        {sponsor.userData?.firstName &&
                        sponsor.userData?.lastName
                          ? `${sponsor.userData.firstName} ${sponsor.userData.lastName}`
                          : sponsor.userData?.username ||
                            `Sponsor #${sponsor.sponsorId}`}
                      </h3>

                      {[
                        {
                          label: "Username",
                          value: sponsor.userData?.username,
                        },
                        { label: "Email", value: sponsor.userData?.email },
                        {
                          label: "Phone",
                          value: sponsor.userData?.phoneNumber,
                        },
                        { label: "Sponsor ID", value: sponsor.sponsorId },
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
                        flexShrink: 0,
                        transition: "all 0.15s",
                      }}
                    >
                      Edit Info
                    </button>
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

export default SponsorViewSponsors;
