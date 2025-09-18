import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); // <-- Key change: Add loading state

  // This effect runs on app startup to verify an existing token
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Verify token with backend to get fresh user data
          const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
        } catch (error) {
          // If token is invalid, clear it
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      }
      // Finished checking, app can now render
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(
      `${API_URL}/api/auth/login`, 
      { email, password },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data) {
      setUser(response.data.user);
      setToken(response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.data.token);
      return response.data.user; // <-- Key change: Return user for LoginPage redirect
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Navigation will now be handled by ProtectedRoute automatically
  };

  // Expose the loading state to the rest of the app
  const value = { user, token, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
