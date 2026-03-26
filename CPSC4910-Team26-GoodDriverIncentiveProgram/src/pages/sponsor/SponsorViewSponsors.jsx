import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";

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
          navigate("/Dashboard");
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
    <div style={{ padding: "2rem" }}>
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

      <h1>Organization Sponsors</h1>
      <p>View and manage sponsors in your organization.</p>

      {error && (
        <div
          style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {sponsors.length === 0 ? (
        <p>No sponsors in your organization yet.</p>
      ) : (
        <div>
          <h2>Sponsors ({sponsors.length})</h2>

          <div style={{ display: "grid", gap: "1rem" }}>
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.sponsorId}
                style={{
                  backgroundColor: "#fff",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  border: "1px solid #e0e0e0",
                }}
              >
                {editingSponsor === sponsor.sponsorId ? (
                  // EDITING MODE
                  <div>
                    <h3 style={{ margin: "0 0 1rem 0" }}>
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
                        onClick={() => handleSaveSponsor(sponsor)}
                        disabled={saving}
                        style={{
                          padding: "0.5rem 1rem",
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
                          padding: "0.5rem 1rem",
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
                  // VIEW MODE
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 0.5rem 0" }}>
                        {sponsor.userData?.firstName &&
                        sponsor.userData?.lastName
                          ? `${sponsor.userData.firstName} ${sponsor.userData.lastName}`
                          : sponsor.userData?.username ||
                            `Sponsor #${sponsor.sponsorId}`}
                      </h3>

                      <div style={{ color: "#666", marginBottom: "0.5rem" }}>
                        <strong>Username:</strong> {sponsor.userData?.username}
                      </div>

                      {sponsor.userData?.email && (
                        <div style={{ color: "#666", marginBottom: "0.5rem" }}>
                          <strong>Email:</strong> {sponsor.userData.email}
                        </div>
                      )}

                      {sponsor.userData?.phoneNumber && (
                        <div style={{ color: "#666", marginBottom: "0.5rem" }}>
                          <strong>Phone:</strong> {sponsor.userData.phoneNumber}
                        </div>
                      )}

                      <div style={{ color: "#666", marginBottom: "0.5rem" }}>
                        <strong>Sponsor ID:</strong> {sponsor.sponsorId}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      {/* NEW: Edit Button */}
                      <button
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#17a2b8",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                        onClick={() => handleEditSponsor(sponsor)}
                      >
                        Edit Info
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

export default SponsorViewSponsors;
