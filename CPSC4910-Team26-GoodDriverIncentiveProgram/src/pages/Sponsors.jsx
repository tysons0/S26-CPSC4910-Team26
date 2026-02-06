import { Link } from "react-router-dom";
import PageTitle from "../components/PageTitle";
import SponsorCard from "../components/Sponsorship";
import "../css/Sponsors.css";

function Sponsors() {
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
      <PageTitle title="View Sponsors"/>
      
      <h1>Sponsors</h1>
      <p>
        Check out our Sponsors! This is where you can view available
        Sponsorships and rewards.
      </p>
      <h2>Apply to be Sponsored</h2>
      <div className="sponsor-grid">
        {TempSponsors.map((sponsor) => (
          <SponsorCard sponsor={sponsor} key={sponsor.name} />
        ))}
      </div>
    </div>
  );
}

export default Sponsors;
