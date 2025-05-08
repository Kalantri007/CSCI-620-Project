import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navigation.css';

const Navigation = ({ isAuthenticated, username, onLogout }) => {
  return (
    <nav className="main-navigation">
      <div className="nav-brand">
        <Link to="/">Chess App</Link>
      </div>
      
      <div className="nav-links">
        {/* Pages accessible to all users */}
        <Link to="/history" className="nav-link">History</Link>
        <Link to="/rules" className="nav-link">Rules</Link>
        <Link to="/about" className="nav-link">About</Link>
        
        {/* Authentication links */}
        {isAuthenticated ? (
          <div className="user-controls">
            <span className="welcome-text">Welcome, {username}!</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        ) : (
          <div className="auth-nav-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;