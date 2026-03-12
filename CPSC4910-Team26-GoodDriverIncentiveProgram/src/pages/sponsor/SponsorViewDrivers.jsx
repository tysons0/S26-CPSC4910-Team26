import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";

function SponsorViewDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orgId, setOrgId] = useState(null);
  const [adjustingDriver, setAdjustingDriver] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const userRole = apiService.getUserRole();
        if (userRole?.toLowerCase() !== "sponsor") {
          navigate("/Dashboard");
          return;
        }

        // Get sponsor's organization ID
        // You'll need to determine how to get this - maybe from user info?
        const sponsorInfo = await apiService.getSponsorInfo();
        const sponsorOrgId = sponsorInfo.organizationId;

        if (!sponsorOrgId) {
          setError("You are not associated with an organization.");
          setLoading(false);
          return;
        }

        setOrgId(sponsorOrgId);

        const orgDrivers =
          await apiService.getOrganizationDrivers(sponsorOrgId);
        setDrivers(orgDrivers);
      } catch (error) {
        console.error("Error fetching drivers:", error);
        setError("Failed to load drivers");
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, [navigate]);

  const handleAdjustPoints = async (driver) => {
    const pointChangeStr = prompt(
      `Adjust points for ${driver.userData?.username || `Driver #${driver.driverId}`}\n\n` +
        `Current Points: ${driver.points || 0}\n\n` +
        `Enter point change (positive to add, negative to subtract):`,
    );

    if (pointChangeStr === null) return; // User cancelled

    const pointChange = parseInt(pointChangeStr, 10);

    if (isNaN(pointChange)) {
      alert("Please enter a valid number");
      return;
    }

    if (pointChange === 0) {
      alert("Point change must be non-zero");
      return;
    }

    const reason = prompt(
      `${pointChange > 0 ? "Adding" : "Removing"} ${Math.abs(pointChange)} points\n\n` +
        `Optional reason for change:`,
    );

    if (reason === null) return; // User cancelled

    setAdjustingDriver(driver.driverId);

    try {
      const updatedDriver = await apiService.changeDriverPoints(
        driver.driverId,
        pointChange,
        reason || "",
      );

      // Update the driver in the local state with new points
      setDrivers((prevDrivers) =>
        prevDrivers.map((d) =>
          d.driverId === driver.driverId
            ? { ...d, points: updatedDriver.points }
            : d,
        ),
      );

      alert(
        `Successfully ${pointChange > 0 ? "added" : "removed"} ${Math.abs(pointChange)} points!\n` +
          `New balance: ${updatedDriver.points} points`,
      );
    } catch (error) {
      console.error("Error adjusting points:", error);
      alert("Failed to adjust points: " + (error.message || "Unknown error"));
    } finally {
      setAdjustingDriver(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="Manage Drivers | Team 26" />
        <h1>Loading drivers...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="Manage Drivers | Team 26" />

      <h1>Organization Drivers</h1>
      <p>View and manage drivers in your organization.</p>

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

      {drivers.length === 0 ? (
        <p>No drivers in your organization yet.</p>
      ) : (
        <div>
          <h2>Drivers ({drivers.length})</h2>

          <div style={{ display: "grid", gap: "1rem" }}>
            {drivers.map((driver) => (
              <div
                key={driver.driverId}
                style={{
                  backgroundColor: "#fff",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  border: "1px solid #e0e0e0",
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
                      {driver.userData?.firstName && driver.userData?.lastName
                        ? `${driver.userData.firstName} ${driver.userData.lastName}`
                        : driver.userData?.username ||
                          `Driver #${driver.driverId}`}
                    </h3>

                    <div style={{ color: "#666", marginBottom: "0.5rem" }}>
                      <strong>Username:</strong> {driver.userData?.username}
                    </div>

                    {driver.userData?.email && (
                      <div style={{ color: "#666", marginBottom: "0.5rem" }}>
                        <strong>Email:</strong> {driver.userData.email}
                      </div>
                    )}

                    {driver.userData?.phoneNumber && (
                      <div style={{ color: "#666", marginBottom: "0.5rem" }}>
                        <strong>Phone:</strong> {driver.userData.phoneNumber}
                      </div>
                    )}

                    <div style={{ color: "#666", marginBottom: "0.5rem" }}>
                      <strong>Driver ID:</strong> {driver.driverId}
                    </div>

                    <div
                      style={{
                        color: "#28a745",
                        fontWeight: "600",
                        fontSize: "1.1rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      <strong>Points:</strong> {driver.points || 0}
                    </div>

                    {driver.addresses && driver.addresses.length > 0 && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <strong>Primary Address:</strong>
                        {driver.addresses
                          .filter((addr) => addr.primary)
                          .map((addr) => (
                            <div
                              key={addr.addressId}
                              style={{
                                color: "#666",
                                fontSize: "0.9rem",
                                marginTop: "0.25rem",
                              }}
                            >
                              {addr.addressLine1}
                              {addr.addressLine2 && `, ${addr.addressLine2}`}
                              <br />
                              {addr.city}, {addr.state} {addr.zipCode}
                            </div>
                          ))}
                      </div>
                    )}

                    <div
                      style={{
                        color: "#999",
                        fontSize: "0.85rem",
                        marginTop: "0.75rem",
                      }}
                    >
                      Member since:{" "}
                      {new Date(
                        driver.userData?.createdAtUtc,
                      ).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <button
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#667eea",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleAdjustPoints(driver)}
                      disabled={adjustingDriver === driver.driverId}
                    >
                      {adjustingDriver === driver.driverId
                        ? "Processing..."
                        : "Adjust Points"}{" "}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SponsorViewDrivers;
