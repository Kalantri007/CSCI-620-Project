import React, { createContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('access');
    return token ? jwtDecode(token) : null;
  });
  const [access, setAccess] = useState(() => localStorage.getItem('access'));
  const [refresh, setRefresh] = useState(() => localStorage.getItem('refresh'));

  const login = (accessToken, refreshToken) => {
    setAccess(accessToken);
    setRefresh(refreshToken);
    localStorage.setItem('access', accessToken);
    localStorage.setItem('refresh', refreshToken);
    setUser(jwtDecode(accessToken));
  };

  const logout = () => {
    setAccess(null);
    setRefresh(null);
    setUser(null);
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  };

  // Optionally, implement token refresh logic here

  return (
    <AuthContext.Provider value={{ user, access, refresh, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
