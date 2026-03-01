import { useState } from "react";
import apiService from "../services/api";

function OrganizationCard({ organization }) {
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleApply = async () => {
    setApplying(true);
    setError("");
    try {
      // TODO: Implement the actual apply endpoint
      // await apiService.applyToOrganization(organization.orgId);

      // For now, just show success
      console.log("Applying to:", organization);
      setSuccess(true);

      // You'll replace this with actual API call once backend is ready
      alert(`Successfully applied to ${organization.name}!`);
    } catch (error) {
      console.error("Error applying to organization:", error);
      setError("Failed to apply. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="sponsor-card">
      <div className="sponsor-image">
        {/* If organizations have logos/images from backend */}
        <img
          src={
            organization.logo ||
            "https://via.placeholder.com/200?text=Organization"
          }
          alt={organization.name}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/200?text=Organization";
          }}
        />
      </div>
      <div className="sponsor-info">
        <h3>{organization.name}</h3>
        <p>
          {organization.description ||
            `Apply to join ${organization.name} and earn exclusive rewards!`}
        </p>

        {organization.pointWorth && (
          <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
            Point Value: ${organization.pointWorth} per point
          </p>
        )}

        {error && (
          <p
            style={{
              color: "#dc3545",
              fontSize: "0.9rem",
              marginTop: "0.5rem",
            }}
          >
            {error}
          </p>
        )}

        {success ? (
          <div
            style={{
              backgroundColor: "#d4edda",
              color: "#155724",
              padding: "0.5rem",
              borderRadius: "4px",
              marginTop: "1rem",
            }}
          >
            Application submitted!
          </div>
        ) : (
          <div className="col action">
            <button
              className="linkish"
              type="button"
              onClick={handleApply}
              disabled={applying}
            >
              {applying ? "Applying..." : "Apply To Organization!"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default OrganizationCard;
