import { useEffect, useState } from "react";
import apiService from "../../services/api";
import PageTitle from "../../components/PageTitle";

function AdminViewDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const data = await apiService.getDrivers();
        console.log("Drivers data:", data); // DEBUG
        setDrivers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching drivers:", err);
        setError(err.message || "Failed to load drivers");
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="View Drivers | Admin" />
        <h1>Loading drivers...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="View Drivers | Admin" />
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="View Drivers | Admin" />
      <h1>Registered Drivers</h1>

      {drivers.length === 0 ? (
        <p>No drivers found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                backgroundColor: "#f8f9fa",
                borderBottom: "2px solid #dee2e6",
              }}
            >
              <th style={{ padding: "0.75rem", textAlign: "left" }}>
                Driver ID
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Name</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>
                Username
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Email</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Points</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>
                Organization
              </th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver, index) => (
              <tr
                key={driver.driverId || index}
                style={{ borderBottom: "1px solid #dee2e6" }}
              >
                <td style={{ padding: "0.75rem" }}>
                  {driver.driverId || "N/A"}
                </td>
                <td style={{ padding: "0.75rem" }}>
                  {driver.userData?.firstName && driver.userData?.lastName
                    ? `${driver.userData.firstName} ${driver.userData.lastName}`
                    : driver.userData?.username || "N/A"}
                </td>
                <td style={{ padding: "0.75rem" }}>
                  {driver.userData?.username || "N/A"}
                </td>
                <td style={{ padding: "0.75rem" }}>
                  {driver.userData?.email || "N/A"}
                </td>
                <td style={{ padding: "0.75rem" }}>{driver.points || 0}</td>
                <td style={{ padding: "0.75rem" }}>
                  {driver.organizationId
                    ? `Org ${driver.organizationId}`
                    : "None"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminViewDrivers;
