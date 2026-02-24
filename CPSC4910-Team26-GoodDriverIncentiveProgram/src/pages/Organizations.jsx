import { Link } from "react-router-dom";
import PageTitle from "../components/PageTitle";
import OrganizationCard from "../components/OrganizationCard";
import "../css/Organizations.css";

function Organizations() {
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
      <PageTitle title="View Sponsors" />

      <h1>Organizations</h1>
      <p>
        This is where you can view available Organizations and apply to start
        earning rewards.
      </p>
      <p>
        View our Organizations and check out the exclusive products they supply!
      </p>
      <h2>Apply to one of our Organizations</h2>
    </div>
  );
}

export default Organizations;

/* <div className="sponsor-grid">
        {TempSponsors.map((sponsor) => (
          <SponsorCard sponsor={sponsor} key={sponsor.name} />
        ))}
      </div>
    */
