import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">OralVis Healthcare</Link>
      <div className="nav-links">
        {user ? (
          <>
            {user.role === 'admin' ? (
              <Link to="/admin-dashboard">Admin Dashboard</Link>
            ) : (
              <Link to="/patient-dashboard">My Dashboard</Link>
            )}
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
