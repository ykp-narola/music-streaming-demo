import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDispatch } from 'react-redux';
import { login, logout as logoutSlice } from '../store/authSlice';
const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const dispatch = useDispatch();
  const logoutFeatures = () => {
    logout();
    dispatch(logoutSlice())
  }
  return (
    <header className="p-4 bg-blue-600 text-white shadow-lg">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Home Link */}
        <Link to="/" className="text-2xl font-bold hover:text-blue-200 transition duration-300">
          Home
        </Link>

        <div className="flex items-center space-x-6">
          {isAuthenticated ? (
            <>
              <Link 
                to="/upload-music" 
                className="text-lg font-medium hover:text-blue-200 transition duration-300"
              >
                Add Music
              </Link>
              <Link 
                to="/music-list" 
                className="text-lg font-medium hover:text-blue-200 transition duration-300"
              >
                Music
              </Link>
              <Link 
                to="/audio-stream" 
                className="text-lg font-medium hover:text-blue-200 transition duration-300"
              >
                Stream
              </Link>
              <button 
                onClick={logoutFeatures} 
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-lg font-medium hover:text-blue-200 transition duration-300"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="text-lg font-medium hover:text-blue-200 transition duration-300"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
