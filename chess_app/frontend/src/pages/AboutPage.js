import React from 'react';
import '../styles/StaticPages.css';

const AboutPage = () => {
  return (
    <div className="page-container">
      <div className="content-container">
        <h1>About Chess Application</h1>
        
        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            Our chess application aims to provide a user-friendly platform for chess enthusiasts of all skill levels.
            Whether you're a beginner learning the basics or an experienced player looking for a challenge,
            our application offers tools and features to enhance your chess experience.
          </p>
        </section>
        
        <section className="about-section">
          <h2>Features</h2>
          <ul>
            <li>Play chess with friends or random opponents</li>
            <li>Track your game history and analyze your moves</li>
            <li>Learn chess rules and strategies</li>
            <li>Participate in the chess community</li>
          </ul>
        </section>
        
        <section className="about-section">
          <h2>Technology</h2>
          <p>
            This application is built using modern web technologies:
          </p>
          <ul>
            <li>Frontend: React.js</li>
            <li>Backend: Django with Django REST Framework</li>
            <li>Real-time gameplay: WebSockets</li>
            <li>Database: SQLite (Development) / PostgreSQL (Production)</li>
          </ul>
        </section>
        
        <section className="about-section">
          <h2>Development Team</h2>
          <p>
            This chess application was developed as part of the CSCI-620 Project.
            Our team is committed to delivering a high-quality chess experience and
            continuously improving the application based on user feedback.
          </p>
        </section>
        
        <section className="about-section">
          <h2>Contact</h2>
          <p>
            Have suggestions or found a bug? We'd love to hear from you!
            Please contact us at <a href="mailto:support@chessapp.example.com">support@chessapp.example.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;