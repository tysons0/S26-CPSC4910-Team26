import { useState } from "react";
import apiService from "../services/api";

function OrganizationCard({ organization, userApplications = [] }) {
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const existingApplication = userApplications.find(
    (app) => app.orgId === organization.orgId,
  );

  const handleApply = async () => {
    if (existingApplication) {
      setError("You already have an application to this organization");
      return;
    }

    // Prompt user for optional message
    const message = prompt(
      `Apply to ${organization.name}?\n\nOptional message to sponsor (why do you want to join?):`,
    );

    // If user clicks cancel, don't apply
    if (message === null) return;

    if (!confirmed) return;

    setApplying(true);
    setError("");

    try {
      await apiService.applyToOrganization(organization.orgId, message || "");
      setSuccess(true);

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error applying to organization:", error);
      setError(error.message || "Failed to apply. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const getButtonContent = () => {
    if (existingApplication) {
      const statusColors = {
        Pending: "#ffc107",
        Accepted: "#28a745",
        Rejected: "#dc3545",
      };

      return {
        text: `Application ${existingApplication.status}`,
        disabled: true,
        color: statusColors[existingApplication.status] || "#6c757d",
      };
    }

    return {
      text: applying ? "Submitting..." : "Apply To Organization!",
      disabled: applying,
      color: null,
    };
  };

  const buttonState = getButtonContent();

  return (
    <div className="sponsor-card">
      <div className="sponsor-image">
        {/* If organizations have logos/images from backend */}
        <img
          src="https://via.placeholder.com/200?text=Organization"
          alt={organization.name}
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
              backgroundColor: "#f8d7da",
              color: "#721c24",
              padding: "0.5rem",
              borderRadius: "4px",
              marginTop: "0.5rem",
              fontSize: "0.9rem",
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
              padding: "0.75rem",
              borderRadius: "4px",
              marginTop: "1rem",
              fontWeight: "500",
            }}
          >
            ✓ Application submitted successfully!
          </div>
        ) : (
          <div className="col action">
            <button
              className="linkish"
              type="button"
              onClick={handleApply}
              disabled={buttonState.disabled}
              style={{
                opacity: buttonState.disabled ? 0.7 : 1,
                cursor: buttonState.disabled ? "not-allowed" : "pointer",
                backgroundColor: buttonState.color || undefined,
                color: buttonState.color ? "white" : undefined,
              }}
            >
              {buttonState.text}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default OrganizationCard;
