import { useState } from "react";

const isActiveStatus = (status) => {
  const s = (status || "").toLowerCase();
  return s === "pending" || s === "submitted" || s === "waiting";
};

const normalizeStatus = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "accepted") return "Accepted";
  if (s === "rejected" || s === "denied") return "Rejected";
  if (isActiveStatus(s)) return "Pending";
  return status || "Unknown";
};

function OrganizationCard({
  organization,
  applicationForOrg = null,
  canApply = true,
  disabledReason = "",
  isApplying = false,
  onApply,
}) {
  const [localMsg, setLocalMsg] = useState("");

  const status = applicationForOrg
    ? normalizeStatus(applicationForOrg.status)
    : null;

  const statusColors = {
    Pending: "#ffc107",
    Accepted: "#28a745",
    Rejected: "#dc3545",
  };

  const disabled = !!applicationForOrg || !canApply || isApplying;

  const buttonText = applicationForOrg
    ? `Application ${status}`
    : isApplying
      ? "Submitting..."
      : "Apply to Organization!";

  const buttonColor = applicationForOrg
    ? statusColors[status] || "#6c757d"
    : undefined;

  return (  
    <div style={{
      borderWidth: "2px",
      borderStyle: "solid",
      borderRadius: "1rem",
      borderColor: "#334155",
      padding: "1rem"
      }} className="sponsor-card">
      <div className="sponsor-image">
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

        {(disabledReason || localMsg) && !applicationForOrg && (
          <p
            style={{
              backgroundColor: "#fff3cd",
              color: "#856404",
              padding: "0.5rem",
              borderRadius: "4px",
              marginTop: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            {localMsg || disabledReason}
          </p>
        )}

        {applicationForOrg?.changeReason && (
          <p
            style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "#666" }}
          >
            Reason: {applicationForOrg.changeReason}
          </p>
        )}

        <div className="col action">
          <button
            className="linkish"
            type="button"
            disabled={disabled}
            onClick={() => {
              setLocalMsg("");

              if (!canApply && disabledReason) {
                setLocalMsg(disabledReason);
                return;
              }

              if (!applicationForOrg) onApply?.(organization);
            }}
            style={{
              opacity: disabled ? 0.7 : 1,
              padding: "0.3rem",
              cursor: disabled ? "not-allowed" : "pointer",
              backgroundColor: buttonColor,
              color: buttonColor ? "white" : undefined,
            }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrganizationCard;
