import { Link } from "react-router-dom";
import "../css/AboutMe.css";

function AboutMe() {
  return (
    <div className="about-container">
      <div className="about-content">
        <div className="about-header">
          <h1>About Me</h1>
          <p className="tagline">
            Learn more about our Good Driver Incentive Program
          </p>
        </div>

        <div className="about-section">
          <h2>About This Project</h2>
          <p>
            This application is designed to help incentivize safe driving
            practices and reward good drivers through our program.
          </p>
        </div>

        <div className="about-section">
          <h2>Our Mission</h2>
          <p>
            We strive to make the roads safer by promoting responsible driving
            habits and recognizing drivers who maintain excellent safety
            records.
          </p>
        </div>

        <div className="about-section">
          <h2>Built by CPSC4910 Team 26:</h2>
          <p>
            Armando Sallas, David Misyuk, Derek Smith, Ross Nebitt, and Tyson
            Small
          </p>
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
export default AboutMe;
