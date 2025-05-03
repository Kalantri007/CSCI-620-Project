import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const HomePage = () => {
  const { user } = useContext(AuthContext);
  return (
    <div>
      <h2>Welcome{user ? `, ${user.username}` : ''}!</h2>
      <p>This is the protected home page.</p>
    </div>
  );
};

export default HomePage;
