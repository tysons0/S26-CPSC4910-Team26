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
  const [driverData, setDriverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyingOrgId, setApplyingOrgId] = useState(null);
  const [leavingOrgId, setLeavingOrgId] = useState(null);

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

        const userInfo = await apiService.getUserInfo();
        //const driver = await apiService.getDriverByUserId(
        //  userInfo?.userData?.id || userInfo?.id,
        //);
        const driver = await apiService.getDriverByUserId(
          userInfo?.userData?.id || userInfo?.id,
        );
        console.log("Full driver object:", driver);
        console.log("Driver org memberships:", driver.driverOrgsAndPoints);
        setDriverData(driver);

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

  const memberOrgIds = useMemo(() => {
    const ids = new Set();

    if (Array.isArray(driverData?.driverOrgsAndPoints)) {
      driverData.driverOrgsAndPoints.forEach((entry) => {
        const orgId = entry?.organizationId ?? entry?.orgId ?? entry?.id;
        if (orgId) ids.add(String(orgId));
      });
    }

    return ids;
  }, [driverData]);

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

      if (created?.applicationId) {
        setUserApplications((prev) => [created, ...prev]);
      } else {
        const refreshed = await apiService.getMyApplications();
        setUserApplications(
          Array.isArray(refreshed)
            ? refreshed
            : (refreshed?.applications ?? []),
        );
      }
    } catch (error) {
      console.error("Error applying:", error);
      setError(error?.message || "Failed to apply. Please try again.");
    } finally {
      setApplyingOrgId(null);
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (!confirm("Are you sure you want to withdraw this application?")) return;
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

  const handleLeaveOrg = async (org) => {
    if (
      !confirm(
        `Are you sure you want to leave ${org.name}?\n\n You will lose access to their catalog and any pending points.`,
      )
    )
      return;

    setLeavingOrgId(org.orgId);
    setError("");

    try {
      await apiService.leaveOrganization(driverData.driverId, org.orgId);

      if (localStorage.getItem("activeOrgId") === String(org.orgId)) {
        localStorage.removeItem("activeOrgId");
      }

      setUserApplications((prev) =>
        prev.filter(
          (a) =>
            !(
              String(a.orgId) === String(org.orgId) &&
              (a.status || "").toLowerCase() === "accepted"
            ),
        ),
      );

      /*
      if (
        driverData &&
        String(driverData.organizationId) === String(org.orgId)
      ) {
        setDriverData((prev) => ({ ...prev, organizationId: null }));
      }
        */

      setDriverData((prev) => ({
        ...prev,
        driverOrgsAndPoints: Array.isArray(prev?.driverOrgsAndPoints)
          ? prev.driverOrgsAndPoints.filter((entry) => {
              const orgId = entry?.organizationId ?? entry?.orgId ?? entry?.id;
              return String(orgId) !== String(org.orgId);
            })
          : [],
      }));

      alert(`You have left ${org.name}.`);
    } catch (error) {
      console.error("Error leaving organization", error);
      setError(
        error.message || "Failed to leave organization. Please try again.",
      );
    } finally {
      setLeavingOrgId(null);
    }
  };

  const memberOrganizations = useMemo(() => {
    return organizations.filter((org) => memberOrgIds.has(String(org.orgId)));
  }, [organizations, memberOrgIds]);

  const availableOrganizations = useMemo(() => {
    return organizations.filter((org) => !memberOrgIds.has(String(org.orgId)));
  }, [organizations, memberOrgIds]);

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
            <strong style={{ color: "#0f172a" }}>Status:</strong>{" "}
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
              backgroundColor: "#cde1f5",
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
          <h2 style={{ marginTop: "2rem" }}>My Organizations</h2>
          {memberOrganizations.length === 0 ? (
            <p>You are not currently in any organizations.</p>
          ) : (
            <div className="sponsor-grid">
              {memberOrganizations.map((org) => (
                <div key={org.orgId} style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      top: "0.6rem",
                      right: "0.6rem",
                      backgroundColor: "#198754",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "0.25rem 0.6rem",
                      borderRadius: "999px",
                      zIndex: 1,
                    }}
                  >
                    ✓ Member
                  </div>

                  <OrganizationCard
                    organization={org}
                    applicationForOrg={null}
                    canApply={false}
                    disabledReason="You are already a member of this organization."
                    isApplying={false}
                    onApply={handleApply}
                  />

                  <div style={{ padding: "0 1rem 1rem" }}>
                    <button
                      onClick={() => handleLeaveOrg(org)}
                      disabled={leavingOrgId === org.orgId}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        backgroundColor:
                          leavingOrgId === org.orgId ? "#aaa" : "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor:
                          leavingOrgId === org.orgId
                            ? "not-allowed"
                            : "pointer",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                      }}
                    >
                      {leavingOrgId === org.orgId
                        ? "Leaving..."
                        : "Leave Organization"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ marginTop: "2rem" }}>Available Organizations</h2>
          {availableOrganizations.length === 0 ? (
            <p>No additional organizations available to apply to right now.</p>
          ) : (
            <div className="sponsor-grid">
              {availableOrganizations.map((org) => {
                const appForOrg = appsByOrgId.get(String(org.orgId)) || null;
                const hasPendingForThisOrg =
                  appForOrg && isActiveStatus(appForOrg.status);

                return (
                  <div key={org.orgId}>
                    <OrganizationCard
                      organization={org}
                      applicationForOrg={appForOrg}
                      canApply={!hasPendingForThisOrg}
                      disabledReason={
                        hasPendingForThisOrg
                          ? "You have a pending application for this organization."
                          : ""
                      }
                      isApplying={applyingOrgId === org.orgId}
                      onApply={handleApply}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Organizations;
