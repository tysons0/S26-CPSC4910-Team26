import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import PageTitle from "../../components/PageTitle";
import OrganizationCard from "../../components/OrganizationCard";
import apiService from "../../services/api";
import "../../css/Organizations.css";

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

function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyingOrgId, setApplyingOrgId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const userInfo = await apiService.getUserInfo();
      console.log("Full user info:", userInfo); // Check if this has driverId
      try {
        if (!apiService.isAuthenticated()) {
          setError("Please log in to view organizations.");
          setLoading(false);
          return;
        }

        const [orgs, applications] = await Promise.all([
          apiService.getOrganizations(),
          apiService.getMyApplications(),
        ]);

        setOrganizations(
          Array.isArray(orgs) ? orgs : (orgs?.organizations ?? []),
        );
        setUserApplications(
          Array.isArray(applications)
            ? applications
            : (applications?.applications ?? []),
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load organizations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const appsByOrgId = useMemo(() => {
    const m = new Map();
    for (const a of userApplications) m.set(String(a.orgId), a);
    return m;
  }, [userApplications]);

  const activeApp = useMemo(
    () => userApplications.find((a) => isActiveStatus(a.status)),
    [userApplications],
  );

  const activeOrgName = useMemo(() => {
    if (!activeApp) return null;
    return (
      organizations.find((o) => String(o.orgId) === String(activeApp.orgId))
        ?.name || null
    );
  }, [activeApp, organizations]);

  const handleApply = async (org) => {
    if (activeApp) {
      setError(
        "You already have an active application. Please wait for a decision.",
      );
      return;
    }

    const message = prompt(
      `Apply to ${org.name}?\n\nOptional message to sponsor (why do you want to join?):`,
    );
    if (message === null) return;

    setApplyingOrgId(org.orgId);
    setError("");

    try {
      const created = await apiService.applyToOrganization(
        org.orgId,
        message || "",
      );

      // If backend returns the created application, add it.
      if (created?.applicationId) {
        setUserApplications((prev) => [created, ...prev]);
      } else {
        // Otherwise refresh
        const refreshed = await apiService.getMyApplications();
        setUserApplications(
          Array.isArray(refreshed)
            ? refreshed
            : (refreshed?.applications ?? []),
        );
      }
    } catch (e) {
      console.error("Error applying:", e);
      setError(e?.message || "Failed to apply. Please try again.");
    } finally {
      setApplyingOrgId(null);
    }
  };

  const handleWithdraw = async (applicationId) => {
    const confirmed = confirm(
      "Are you sure you want to withdraw this application?",
    );

    if (!confirmed) return;

    setError("");

    try {
      await apiService.withdrawApplication(applicationId);

      setUserApplications((prev) =>
        prev.filter((app) => app.applicationId !== applicationId),
      );

      alert("Application withdrawn successfully!");
    } catch (error) {
      console.error("Error withdrawing application:", error);
      setError(
        error.message || "Failed to withdraw application. Please try again.",
      );
    }
  };

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

      {/* Current Application Status */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "0.75rem" }}>My Application</h2>

        {!activeApp ? (
          <div
            style={{
              backgroundColor: "#cde1f5",
              padding: "1rem",
              borderRadius: "8px",
              borderLeft: "4px solid #0066cc",
            }}
          >
            <strong style={{color: "#0f172a"}}>Status:</strong>{" "}
            <span style={{ fontWeight: 700, color: "#0066cc" }}>
              No active application
            </span>
            <div style={{ marginTop: "0.5rem", color: "#666" }}>
              Apply to an organization below to get started.
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "#e7f3ff",
              padding: "1rem",
              borderRadius: "8px",
              borderLeft: "4px solid #0066cc",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ fontSize: "1.05rem" }}>
                  <strong>
                    {activeOrgName || `Organization #${activeApp.orgId}`}
                  </strong>
                </div>

                <div style={{ marginTop: "0.25rem" }}>
                  <strong>Status:</strong>{" "}
                  <span style={{ fontWeight: 700, color: "#856404" }}>
                    {normalizeStatus(activeApp.status)}
                  </span>
                </div>

                {activeApp.createdAtUtc && (
                  <div style={{ marginTop: "0.25rem", color: "#666" }}>
                    <strong>Submitted:</strong>{" "}
                    {new Date(activeApp.createdAtUtc).toLocaleString()}
                  </div>
                )}

                {activeApp.changeReason && (
                  <div style={{ marginTop: "0.5rem", color: "#666" }}>
                    <strong>Note:</strong> {activeApp.changeReason}
                  </div>
                )}
              </div>

              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => handleWithdraw(activeApp.applicationId)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Withdraw Application
                </button>
              </div>
            </div>

            <div style={{ marginTop: "0.75rem", color: "#666" }}>
              You can only have one active application at a time.
            </div>
          </div>
        )}
      </div>

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
            {organizations.map((org) => {
              const appForOrg = appsByOrgId.get(String(org.orgId)) || null;

              const canApply = !activeApp; // one active at a time
              const disabledReason = activeApp
                ? "You already have an active application. Wait for a decision before applying again."
                : "";

              return (
                <OrganizationCard
                  key={org.orgId}
                  organization={org}
                  applicationForOrg={appForOrg}
                  canApply={canApply}
                  disabledReason={disabledReason}
                  isApplying={applyingOrgId === org.orgId}
                  onApply={handleApply}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default Organizations;
