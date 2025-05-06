import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navigation.css';
import api from '../../services/api';

const Navigation = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('authToken') !== null;
  const username = localStorage.getItem('username');

  const handleLogout = async () => {
    try {
      await api.logout();
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      navigate('/');
      window.location.reload(); // Force reload to update the navigation bar
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <nav className="main-navigation">
      <div className="nav-logo">
        <Link to="/">Chess App</Link>
      </div>
      <div className="nav-links">
        {/* Links available to all users */}
        <Link to="/history" className="nav-link">History</Link>
        <Link to="/rules" className="nav-link">Rules</Link>
        <Link to="/about" className="nav-link">About</Link>

        {/* Links available only to authenticated users */}
        {isAuthenticated ? (
          <>
            <Link to="/" className="nav-link">Dashboard</Link>
            <div className="user-controls">
              <span>Welcome, {username}!</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;