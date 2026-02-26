import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PageTitle from "../components/PageTitle";
import OrganizationCard from "../components/OrganizationCard";
import apiService from "../services/api";
import "../css/Organizations.css";

function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgs = await apiService.getOrganizations();
        setOrganizations(orgs);
      } catch (error) {
        console.error("Failed to retreive Organizations.", error);
        setError("Failed to load Organizations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="View Organizations | Team 26" />
        <h1>Loading organizations...</h1>
      </div>
    );
  }

  const TempSponsors = [
    {
      name: "Jordan",
      sponsorImage: "jordan.png",
    },
    {
      name: "Nike",
      sponsorImage: "nike.png",
    },
    {
      name: "Adidas",
      sponsorImage: "adidas.png",
    },
  ];

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
              <OrganizationCard organization={org} key={org.orgId || org.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Organizations;
