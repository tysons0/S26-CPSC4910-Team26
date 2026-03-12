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
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Username</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.id || driver.driverId}>
                <td>{driver.id || driver.driverId}</td>
                <td>
                  {driver.firstName} {driver.lastName}
                </td>
                <td>{driver.email}</td>
                <td>{driver.userName || driver.username}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminViewDrivers;
