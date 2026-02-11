import { Link } from "react-router-dom";
import PageTitle from "../components/PageTitle";
import { useEffect, useState } from "react";
import apiService from "../services/api";
import "../css/About.css";

function About() {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamInfo = async () => {
      try {
        const data = await apiService.getTeamInfo();
        setTeamData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamInfo();
  }, []);

  return (
    <div className="about-container">
      <PageTitle title="About Page | Team 26" />

      <div className="about-content">
        <div className="about-header">
          <h1>ByteMe Team26</h1>
          <p className="tagline">Welcome to our About Page!</p>
          <p className="tagline">
            Learn more about our Good Driver Incentive Program
          </p>
        </div>
        <div className="about-section">
          <h2> Sprint {teamData?.teamNumber || "1"}</h2>
          <h2>
            {" "}
            Release Date :{" "}
            {teamData?.releaseDate
              ? new Date(teamData?.releaseDate).toLocaleDateString()
              : "TBD"}
          </h2>
          <div className="about-header">
            <h1> {teamData?.productName || "Good Driver Incentive Program"}</h1>
          </div>
        </div>
        <div className="about-section">
          <h2>Product Description</h2>
          <p>
            This application is designed to help incentivize safe driving
            practices and reward good drivers through our program.
          </p>
        </div>

        <div className="about-section">
          <h2>Built by CPSC4910 Team 26:</h2>
          <h2>
            Armando Sallas, David Misyuk, Derek Smith, Ross Nebitt, and Tyson
            Small
          </h2>
        </div>
        <div className="about-actions">
          <Link to="/Login" className="login-link-button">
            Login Here
          </Link>
        </div>
      </div>
    </div>
  );
}
export default About;
