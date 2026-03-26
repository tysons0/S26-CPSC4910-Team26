import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/Dashboard.css";

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
          navigate("/Dashboard");
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

  return (
    <div style={{ padding: "2rem" }}>
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

      <h1>Application Management</h1>
      <p>Review and manage driver applications to your organization.</p>

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

      {/* Pending Applications */}
      <h2>Pending Applications ({pendingApplications.length})</h2>
      {pendingApplications.length === 0 ? (
        <p>No pending applications.</p>
      ) : (
        <div style={{ marginBottom: "3rem" }}>
          {pendingApplications.map((app) => (
            <div
              key={app.applicationId}
              style={{
                backgroundColor: "#fff",
                padding: "1.5rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                border: "2px solid #ffc107",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 0.5rem 0" }}>
                    Driver ID: {app.driverId}
                  </h3>
                  <p style={{ margin: "0.25rem 0", color: "#666" }}>
                    <strong>Organization ID:</strong> {app.orgId}
                  </p>
                  <p style={{ margin: "0.25rem 0", color: "#666" }}>
                    <strong>Applied:</strong>{" "}
                    {new Date(app.createdAtUtc).toLocaleDateString()}
                  </p>
                  {app.driverMessage && (
                    <p style={{ margin: "0.5rem 0", fontStyle: "italic" }}>
                      Message: "{app.driverMessage}"
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() =>
                      handleStatusUpdate(app.applicationId, "Accepted")
                    }
                    disabled={processing === app.applicationId}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor:
                        processing === app.applicationId
                          ? "not-allowed"
                          : "pointer",
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
                      padding: "0.5rem 1rem",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor:
                        processing === app.applicationId
                          ? "not-allowed"
                          : "pointer",
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
      <h2>Processed Applications ({processedApplications.length})</h2>
      {processedApplications.length === 0 ? (
        <p>No processed applications.</p>
      ) : (
        <div>
          {processedApplications.map((app) => (
            <div
              key={app.applicationId}
              style={{
                backgroundColor: "#f8f9fa",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                borderLeft: `4px solid ${app.status === "Accepted" ? "#28a745" : "#dc3545"}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>Driver ID:</strong> {app.driverId}
                  {" | "}
                  <strong>Org ID:</strong> {app.orgId}
                </div>
                <div>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      backgroundColor:
                        app.status === "Accepted" ? "#d4edda" : "#f8d7da",
                      color: app.status === "Accepted" ? "#155724" : "#721c24",
                    }}
                  >
                    {app.status}
                  </span>
                </div>
              </div>
              {app.changeReason && (
                <p
                  style={{
                    margin: "0.5rem 0 0 0",
                    fontSize: "0.9rem",
                    color: "#666",
                  }}
                >
                  Reason: {app.changeReason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SponsorApplications;
