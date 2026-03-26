import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/Dashboard.css";

function DriverPointHistory() {
  const [pointHistory, setPointHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPoints, setCurrentPoints] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPointHistory = async () => {
      try {
        if (!apiService.isAuthenticated()) {
          navigate("/Login");
          return;
        }

        // Get driver info to get driverId
        const driverInfo = await apiService.getDriverInfo();
        const driverId = driverInfo.driverId;

        if (!driverId) {
          setError("Could not determine driver ID");
          setLoading(false);
          return;
        }

        // Get current points
        setCurrentPoints(driverInfo.points || 0);

        // Get point history
        const history = await apiService.getDriverPointHistory(driverId);
        console.log("Raw point history response:", history); // DEBUG
        console.log("Is array?", Array.isArray(history)); // DEBUG
        console.log("Length:", history?.length); // DEBUG

        // Sort by date, newest first
        const sortedHistory = (Array.isArray(history) ? history : []).sort(
          (a, b) => new Date(b.createdAtUtc) - new Date(a.createdAtUtc),
        );

        setPointHistory(sortedHistory);
      } catch (error) {
        console.error("Error fetching point history:", error);
        setError("Failed to load point history");
      } finally {
        setLoading(false);
      }
    };

    fetchPointHistory();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="Point History | Team 26" />
        <h1>Loading point history...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="Point History | Team 26" />

      <h1>Point History</h1>

      {/* Current Points Summary */}
      <div
        style={{
          backgroundColor: "#e7f3ff",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
          borderLeft: "4px solid #667eea",
        }}
      >
        <div
          style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.25rem" }}
        >
          Current Balance
        </div>
        <div style={{ fontSize: "2rem", fontWeight: "700", color: "#667eea" }}>
          {currentPoints} Points
        </div>
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

      {pointHistory.length === 0 ? (
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "2rem",
            borderRadius: "8px",
            textAlign: "center",
            color: "#666",
          }}
        >
          <p style={{ margin: 0 }}>No point history yet.</p>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>
            Point changes will appear here when sponsors adjust your points.
          </p>
        </div>
      ) : (
        <div>
          <h2>Transaction History ({pointHistory.length})</h2>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {pointHistory.map((transaction, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#fff",
                  padding: "1rem",
                  borderRadius: "8px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  borderLeft: `4px solid ${transaction.pointChange > 0 ? "#28a745" : "#dc3545"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      color:
                        transaction.pointChange > 0 ? "#28a745" : "#dc3545",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {transaction.pointChange > 0 ? "+" : ""}
                    {transaction.pointChange} Points
                  </div>

                  {transaction.reason && (
                    <div style={{ color: "#666", marginBottom: "0.25rem" }}>
                      <strong>Reason:</strong> {transaction.reason}
                    </div>
                  )}

                  {transaction.sponsorId && (
                    <div style={{ color: "#999", fontSize: "0.85rem" }}>
                      By Sponsor #{transaction.sponsorId}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    textAlign: "right",
                    color: "#999",
                    fontSize: "0.85rem",
                  }}
                >
                  {new Date(transaction.createdAtUtc).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverPointHistory;
