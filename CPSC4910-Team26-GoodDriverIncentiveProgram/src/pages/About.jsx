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

  if (loading) {
    return <span>Loading Team Information...</span>;
  } 
  
  else if (error) {
    return <span>Error loading team information: {error}</span>;
  } 
  
  else {
    return (
      <div className="about-container">
        <PageTitle title="About Page | Team 26" />

        <div className="about-content">
          <div className="about-header">
            <h1>
              {teamData.teamName} Team {teamData.teamNumber}{" "}
            </h1>
            <p className="tagline">Welcome to our About Page!</p>
            <p className="tagline">
              Learn more about our Good Driver Incentive Program
            </p>
          </div>
          <div className="about-section">
            <h2> Sprint {teamData?.version || "?"}</h2>
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
              {teamData?.productDescription ||
                "Our Good Driver Incentive Program is designed to reward safe and responsible driving habits. By participating in our program, drivers can earn points for good driving behavior, which can be redeemed for discounts on insurance premiums, gift cards, and other rewards. Our goal is to promote safer roads and encourage drivers to adopt better driving habits."}
            </p>
          </div>

          <div className="about-section">
            <h2>Built by CPSC4910 Team 26:</h2>
            <h2>{teamData?.teamMembers?.join(", ") ?? ""}</h2>
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
}
export default About;
