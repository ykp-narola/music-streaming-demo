import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="p-4 bg-blue-600 text-white">
      <nav className="flex justify-between">
        <Link to="/" className="text-xl">Home</Link>
        <div>
          {isAuthenticated ? (
            <>
              <button onClick={logout} className="mr-4">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="mr-4">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
