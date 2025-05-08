import React from 'react';
import Navigation from '../components/Navigation';
import '../styles/InfoPages.css';

const AboutPage = () => {
  // Get auth status from localStorage (same as HomePage)
  const isAuthenticated = localStorage.getItem('authToken') !== null;
  const username = localStorage.getItem('username');
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    window.location.href = '/';
  };

  return (
    <div className="page-container">
      <Navigation 
        isAuthenticated={isAuthenticated} 
        username={username}
        onLogout={handleLogout}
      />
      
      <div className="content-container">
        <h1>About Chess App</h1>
        
        <section className="info-section">
          <h2>Project Overview</h2>
          <p>
            Chess App is a modern online chess platform developed as part of CSCI-620 Project. 
            My goal is to create a user-friendly environment where chess enthusiasts can play 
            chess online, track their progress, and connect with other players.
          </p>
          <p>
            This application features real-time gameplay, a clean and intuitive interface, and 
            a robust backend system that ensures fair and smooth gameplay.
          </p>

          <p>Chess originated in the 6th century in India as a game called <strong>Chaturanga</strong>, representing an ancient military strategy.</p>
            <p>It spread to Persia, where it became known as <strong>Shatranj</strong>. The game was introduced to Europe in the 15th century, evolving into modern chess with standardized rules.</p>
            <p>In the 20th century, chess saw the rise of world championships and grandmasters. The famous IBM Deep Blue computer defeated Garry Kasparov in 1997.</p>

        </section>
        
        <section className="info-section">
          <h2>Developer Information</h2>
          <div className="developer-profile">
            <div className="developer-info">
              <h3>Vyankatesh Kalantri</h3>
              <p>Masters Student at CSU Chico</p>
              <p>
                John is a senior computer science student with expertise in full-stack web development. 
                His interests include game development, algorithms, and artificial intelligence.
              </p>
            </div>
          </div>
          
          <div className="developer-profile">
            <div className="developer-info">
              <h3>Jane Doe</h3>
              <p>UX/UI Designer</p>
              <p>
                Jane is a talented designer with a background in human-computer interaction. 
                She's responsible for making Chess App intuitive and visually appealing.
              </p>
            </div>
          </div>
          
          <div className="developer-profile">
            <div className="developer-info">
              <h3>Alex Johnson</h3>
              <p>Back-End Developer</p>
              <p>
                Alex specializes in server-side technologies and database management. 
                He implemented the real-time gameplay and user authentication systems.
              </p>
            </div>
          </div>
        </section>
        
        <section className="info-section">
          <h2>Technologies Used</h2>
          <ul>
            <li><strong>Frontend:</strong> React.js, CSS3, Chess.js, React-Chessboard</li>
            <li><strong>Backend:</strong> Django, Django REST Framework, Django Channels</li>
            <li><strong>WebSocket:</strong> For real-time game updates</li>
            <li><strong>Authentication:</strong> Token-based authentication system</li>
            <li><strong>Database:</strong> SQLite for development</li>
          </ul>
        </section>
        
        <section className="info-section">
          <h2>Contact Us</h2>
          <p>
            We welcome your feedback and suggestions! If you encounter any issues or have ideas for 
            improvements, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> chessapp@example.com<br />
            <strong>GitHub:</strong> github.com/example/chess-app
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;