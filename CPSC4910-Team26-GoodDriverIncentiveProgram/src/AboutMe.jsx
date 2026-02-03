import { Link } from 'react-router-dom'
import './App.css'

function AboutMe() {
  return (
    <div>
      <h1>About Me</h1>
      <p>Welcome to the About page of the Good Driver Incentive Program.</p>
      
      <section>
        <h2>About This Project</h2>
        <p>
          This application is designed to help incentivize safe driving practices
          and reward good drivers through our program.
        </p>
      </section>

      <section>
        <h2>Our Mission</h2>
        <p>
          We strive to make the roads safer by promoting responsible driving habits
          and recognizing drivers who maintain excellent safety records.
        </p>
      </section>

      <section>
        <h2>Built by CPSC4910 Team 26:</h2>
        <p>Armando Sallas, David Misyuk, Derek Smith, Ross Nebitt, and Tyson Small</p>
      </section>

      <nav>
        <Link to="/">Back to Home</Link>
      </nav>
    </div>
  )
}

export default AboutMe
