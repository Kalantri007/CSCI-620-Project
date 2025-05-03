import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  return (
    <nav>
      <Link to="/">Home</Link>
      {user ? (
        <>
          <span style={{ marginLeft: 10 }}>Hello, {user.username}</span>
          <button onClick={logout} style={{ marginLeft: 10 }}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login" style={{ marginLeft: 10 }}>Login</Link>
          <Link to="/register" style={{ marginLeft: 10 }}>Register</Link>
        </>
      )}
    </nav>
  );
};

export default Navbar;
