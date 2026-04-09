import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/SponsorDashboard.css";
import PovBanner from "../../components/POVBanner";

function SponsorApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // Check if user is a sponsor
        const userRole = apiService.getUserRole();
        if (userRole?.toLowerCase() !== "sponsor") {
          navigate("/About");
          return;
        }

        const apps = await apiService.getApplications();

        const currentUser = apiService.getCurrentUser();

        //const sponsorOrgId = currentUser.orgId || currentUser.organizationId;

        // Filter to only applications for sponsor's organization
        //const filteredApps = apps.filter((app) => app.orgId === sponsorOrgId);

        setApplications(apps);
      } catch (error) {
        console.error("Error fetching applications:", error);
        setError("Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [navigate]);

  const handleStatusUpdate = async (applicationId, newStatus) => {
    const changeReason = prompt(
      `${newStatus === "Accepted" ? "Accept" : "Reject"} this application?\n\nOptional reason:`,
    );

    if (changeReason === null) return; // User cancelled

    setProcessing(applicationId);

    try {
      await apiService.updateApplicationStatus(
        applicationId,
        newStatus,
        changeReason || "",
      );

      // Update local state
      setApplications((apps) =>
        apps.map((app) =>
          app.applicationId === applicationId
            ? { ...app, status: newStatus, changeReason: changeReason }
            : app,
        ),
      );

      alert(`Application ${newStatus.toLowerCase()} successfully!`);
    } catch (error) {
      console.error("Error updating application:", error);
      alert("Failed to update application status");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="Manage Applications | Team 26" />
        <h1>Loading applications...</h1>
      </div>
    );
  }

  const pendingApplications = applications.filter((app) => {
    const status = app.status?.toLowerCase();
    return (
      status === "pending" || status === "waiting" || status === "submitted"
    );
  });

  const processedApplications = applications.filter((app) => {
    const status = app.status?.toLowerCase();
    return (
      status === "accepted" || status === "rejected" || status === "denied"
    );
  });

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="Manage Applications | Team 26" />
        <h1>Loading applications...</h1>
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
      <PovBanner />
      <PageTitle title="Manage Applications | Team 26" />

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
        Application Management
      </h1>
      <p style={{ color: "var(--text-alt)", marginBottom: "1.5rem" }}>
        Review and manage driver applications to your organization.
      </p>

      {error && (
        <div
          className="alert-error"
          style={{ padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}
        >
          {error}
        </div>
      )}

      {/* Pending Applications */}
      <h2 style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
        Pending Applications ({pendingApplications.length})
      </h2>
      {pendingApplications.length === 0 ? (
        <p style={{ color: "var(--text-alt)", marginBottom: "3rem" }}>
          No pending applications.
        </p>
      ) : (
        <div style={{ marginBottom: "3rem" }}>
          {pendingApplications.map((app) => (
            <div
              key={app.applicationId}
              style={{
                background: "var(--surface-alt)",
                padding: "1.5rem",
                borderRadius: "10px",
                marginBottom: "1rem",
                border: "1px solid var(--border)",
                borderLeft: "4px solid #f6ad55",
                transition: "background 0.3s, border-color 0.3s",
              }}
            >
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
                      margin: "0 0 0.5rem 0",
                      color: "var(--text-muted)",
                    }}
                  >
                    Driver ID: {app.driverId}
                  </h3>
                  <p
                    style={{
                      margin: "0.25rem 0",
                      color: "var(--text-alt)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <strong style={{ color: "var(--text-muted)" }}>
                      Organization ID:
                    </strong>{" "}
                    {app.orgId}
                  </p>
                  <p
                    style={{
                      margin: "0.25rem 0",
                      color: "var(--text-alt)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <strong style={{ color: "var(--text-muted)" }}>
                      Applied:
                    </strong>{" "}
                    {new Date(app.createdAtUtc).toLocaleDateString()}
                  </p>
                  {app.driverMessage && (
                    <p
                      style={{
                        margin: "0.5rem 0",
                        fontStyle: "italic",
                        color: "var(--text-alt)",
                        fontSize: "0.9rem",
                      }}
                    >
                      "{app.driverMessage}"
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    onClick={() =>
                      handleStatusUpdate(app.applicationId, "Accepted")
                    }
                    disabled={processing === app.applicationId}
                    style={{
                      padding: "0.5rem 1.1rem",
                      background: "rgba(72,187,120,0.15)",
                      color: "#276749",
                      border: "1px solid rgba(72,187,120,0.4)",
                      borderRadius: "7px",
                      cursor:
                        processing === app.applicationId
                          ? "not-allowed"
                          : "pointer",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      opacity: processing === app.applicationId ? 0.6 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() =>
                      handleStatusUpdate(app.applicationId, "Rejected")
                    }
                    disabled={processing === app.applicationId}
                    style={{
                      padding: "0.5rem 1.1rem",
                      background: "rgba(231,76,60,0.1)",
                      color: "#c0392b",
                      border: "1px solid rgba(231,76,60,0.3)",
                      borderRadius: "7px",
                      cursor:
                        processing === app.applicationId
                          ? "not-allowed"
                          : "pointer",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      opacity: processing === app.applicationId ? 0.6 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Processed Applications */}
      <h2 style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
        Processed Applications ({processedApplications.length})
      </h2>
      {processedApplications.length === 0 ? (
        <p style={{ color: "var(--text-alt)" }}>No processed applications.</p>
      ) : (
        <div>
          {processedApplications.map((app) => {
            const accepted = app.status === "Accepted";
            return (
              <div
                key={app.applicationId}
                style={{
                  background: "var(--surface-alt)",
                  padding: "1rem 1.25rem",
                  borderRadius: "10px",
                  marginBottom: "1rem",
                  border: "1px solid var(--border)",
                  borderLeft: `4px solid ${accepted ? "#68d391" : "#fc8181"}`,
                  transition: "background 0.3s, border-color 0.3s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: "0.9rem", color: "var(--text-alt)" }}>
                    <strong style={{ color: "var(--text-muted)" }}>
                      Driver ID:
                    </strong>{" "}
                    {app.driverId}
                    {" · "}
                    <strong style={{ color: "var(--text-muted)" }}>
                      Org ID:
                    </strong>{" "}
                    {app.orgId}
                  </div>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      background: accepted
                        ? "rgba(72,187,120,0.15)"
                        : "rgba(231,76,60,0.1)",
                      color: accepted ? "#276749" : "#c0392b",
                      border: `1px solid ${accepted ? "rgba(72,187,120,0.3)" : "rgba(231,76,60,0.25)"}`,
                    }}
                  >
                    {app.status}
                  </span>
                </div>
                {app.changeReason && (
                  <p
                    style={{
                      margin: "0.5rem 0 0 0",
                      fontSize: "0.875rem",
                      color: "var(--text-alt)",
                    }}
                  >
                    Reason: {app.changeReason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SponsorApplications;
