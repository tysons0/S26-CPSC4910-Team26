import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/Dashboard.css";
import PovBanner from "../../components/POVBanner";

function DriverPointHistory() {
  const [pointHistory, setPointHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [driverData, setDriverData] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("all");
  const [sponsorOrgMap, setSponsorOrgMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPointHistory = async () => {
      try {
        if (!apiService.isAuthenticated()) {
          navigate("/Login");
          return;
        }

        const driverInfo = await apiService.getDriverInfo();
        const driverId = driverInfo.driverId;

        if (!driverId) {
          setError("Could not determine driver ID");
          setLoading(false);
          return;
        }

        setDriverData(driverInfo);

        const [history, allOrgs] = await Promise.all([
          apiService.getDriverPointHistory(driverId),
          apiService.getOrganizations().catch(() => []),
        ]);

        // Build sponsorId -> orgId map
        const sponsorOrgMap = {};
        const orgList = Array.isArray(allOrgs) ? allOrgs : [];

        await Promise.all(
          (driverInfo.driverOrgsAndPoints || []).map(async (entry) => {
            const orgId = entry.orgId ?? entry.organizationId;
            try {
              const sponsors = await apiService.getOrganizationSponsors(orgId);
              (Array.isArray(sponsors) ? sponsors : []).forEach((s) => {
                const sponsorId = s.sponsorId ?? s.id;
                if (sponsorId) sponsorOrgMap[String(sponsorId)] = String(orgId);
              });
            } catch {
              // skip if this org's sponsors can't be fetched
            }
          }),
        );

        const sortedHistory = (Array.isArray(history) ? history : []).sort(
          (a, b) => new Date(b.createdAtUtc) - new Date(a.createdAtUtc),
        );

        setPointHistory(sortedHistory);
        console.log("Sample transaction:", sortedHistory[0]);
        setOrgs(Array.isArray(allOrgs) ? allOrgs : []);
        setSponsorOrgMap(sponsorOrgMap);
      } catch (error) {
        console.error("Error fetching point history:", error);
        setError("Failed to load point history");
      } finally {
        setLoading(false);
      }
    };

    fetchPointHistory();
  }, [navigate]);

  const memberOrgs = (driverData?.driverOrgsAndPoints || []).map((entry) => {
    const org = orgs.find(
      (o) => String(o.orgId) === String(entry.orgId ?? entry.organizationId),
    );
    return {
      orgId: entry.orgId ?? entry.organizationId,
      name: org?.name ?? `Org #${entry.orgId ?? entry.organizationId}`,
      points: entry.points ?? entry.pointBalance ?? entry.currentPoints ?? 0,
    };
  });

  const filteredHistory =
    selectedOrgId === "all"
      ? pointHistory
      : pointHistory.filter(
          (t) => sponsorOrgMap[String(t.sponsorId)] === String(selectedOrgId),
        );

  const selectedOrgPoints =
    selectedOrgId === "all"
      ? memberOrgs.reduce((sum, o) => sum + o.points, 0)
      : (memberOrgs.find((o) => String(o.orgId) === String(selectedOrgId))
          ?.points ?? 0);

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="Point History | Team 26" />
        <h1>Loading point history...</h1>
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
      <PageTitle title="Point History | Team 26" />

      <header className="catalog-header">
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="submit"
            onClick={() => navigate("/DriverDashboard")}
          >
            Back
          </button>
        </div>
      </header>

      <h1 style={{ color: "var(--text-muted)" }}>Point History</h1>

      {/* Org filter + balance */}
      <div
        style={{
          background: "var(--surface-alt)",
          border: "1px solid var(--border)",
          borderLeft: "4px solid #667eea",
          borderRadius: "8px",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--text-alt)",
              marginBottom: "0.25rem",
            }}
          >
            {selectedOrgId === "all"
              ? "Total Balance (All Orgs)"
              : memberOrgs.find(
                  (o) => String(o.orgId) === String(selectedOrgId),
                )?.name}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#667eea" }}>
            {selectedOrgPoints} Points
          </div>
        </div>

        {memberOrgs.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label
              style={{
                fontWeight: 600,
                fontSize: "0.9rem",
                color: "var(--text-muted)",
              }}
            >
              Filter by org:
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="view-select"
              style={{ width: "auto" }}
            >
              <option value="all">All Organizations</option>
              {memberOrgs.map((o) => (
                <option key={o.orgId} value={o.orgId}>
                  {o.name}
                </option>
              ))}
            </select>
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

      {filteredHistory.length === 0 ? (
        <div
          style={{
            background: "var(--surface-alt)",
            border: "1px solid var(--border)",
            padding: "2rem",
            borderRadius: "8px",
            textAlign: "center",
            color: "var(--text-alt)",
          }}
        >
          <p style={{ margin: 0 }}>No point history yet.</p>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>
            Point changes will appear here when sponsors adjust your points.
          </p>
        </div>
      ) : (
        <div>
          <h2 style={{ color: "var(--text-muted)" }}>
            Transaction History ({filteredHistory.length})
          </h2>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {filteredHistory.map((transaction, index) => {
              const positive = transaction.pointChange > 0;
              return (
                <div
                  key={index}
                  style={{
                    background: "var(--surface-alt)",
                    padding: "1rem 1.25rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    borderLeft: `4px solid ${positive ? "#68d391" : "#fc8181"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                    transition: "background 0.3s",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: positive ? "#276749" : "#c0392b",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {positive ? "+" : ""}
                      {transaction.pointChange} Points
                    </div>
                    {transaction.reason && (
                      <div
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--text-alt)",
                          marginBottom: "0.2rem",
                        }}
                      >
                        <strong style={{ color: "var(--text-muted)" }}>
                          Reason:
                        </strong>{" "}
                        {transaction.reason}
                      </div>
                    )}
                    {transaction.sponsorId && (
                      <div
                        style={{ fontSize: "0.8rem", color: "var(--text-alt)" }}
                      >
                        By Sponsor #{transaction.sponsorId}
                      </div>
                    )}
                    {transaction.sponsorId &&
                      sponsorOrgMap[String(transaction.sponsorId)] && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-alt)",
                            marginTop: "0.15rem",
                          }}
                        >
                          <strong style={{ color: "var(--text-muted)" }}>
                            Org:
                          </strong>{" "}
                          {memberOrgs.find(
                            (o) =>
                              String(o.orgId) ===
                              sponsorOrgMap[String(transaction.sponsorId)],
                          )?.name ??
                            `Org #${sponsorOrgMap[String(transaction.sponsorId)]}`}
                        </div>
                      )}
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      color: "var(--text-alt)",
                      fontSize: "0.85rem",
                      flexShrink: 0,
                    }}
                  >
                    {new Date(transaction.createdAtUtc).toLocaleString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverPointHistory;
