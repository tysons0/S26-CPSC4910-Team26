import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PageTitle from "../../components/PageTitle";
import OrganizationCard from "../../components/OrganizationCard";
import apiService from "../../services/api";
import "../../css/Organizations.css";

function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!apiService.isAuthenticated()) {
          setError("Please log in to view organizations.");
          setLoading(false);
          return;
        }

        // Fetch both organizations and user's applications
        const [orgs, applications] = await Promise.all([
          apiService.getOrganizations(),
          apiService.getMyApplications(),
        ]);

        setOrganizations(orgs);
        setUserApplications(applications);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load organizations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="View Organizations | Team 26" />
        <h1>Loading organizations...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="View Organization | Team26" />

      <h1>Organizations</h1>
      <p>
        This is where you can view available Organizations and apply to start
        earning rewards.
      </p>
      <p>
        View our Organizations and check out the exclusive products they supply!
      </p>

      {/* Show user's active application status */}
      {userApplications.length > 0 && (
        <div
          style={{
            backgroundColor: "#e7f3ff",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "2rem",
            borderLeft: "4px solid #0066cc",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Your Applications:</h3>
          {userApplications.map((app) => (
            <div key={app.applicationId} style={{ marginBottom: "0.5rem" }}>
              <strong>
                {organizations.find((o) => o.orgId === app.orgId)?.name ||
                  "Organization"}
              </strong>
              {" - "}
              <span
                style={{
                  color:
                    app.status === "Accepted"
                      ? "#28a745"
                      : app.status === "Rejected"
                        ? "#dc3545"
                        : "#ffc107",
                  fontWeight: "600",
                }}
              >
                {app.status}
              </span>
              {app.changeReason && (
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "#666",
                    marginTop: "0.25rem",
                  }}
                >
                  Reason: {app.changeReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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

      {organizations.length === 0 ? (
        <p>No organizations available at this time.</p>
      ) : (
        <>
          <h2>Apply to Join an Organization</h2>
          <div className="sponsor-grid">
            {organizations.map((org) => (
              <OrganizationCard
                organization={org}
                userApplications={userApplications}
                key={org.orgId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Organizations;
