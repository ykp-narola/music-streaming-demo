import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import UploadMusic from './pages/UploadMusic';
import Register from './pages/Register';
import MusicList from './pages/MusicList';
import AudioStream from './pages/AudioStreaming';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => (
  <AuthProvider>
    <Router>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/upload-music"
          element={
            <ProtectedRoute>
              <UploadMusic />
            </ProtectedRoute>
          }
        />
        <Route
          path="/music-list"
          element={
            <ProtectedRoute>
              <MusicList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audio-stream"
          element={
            <ProtectedRoute>
              <AudioStream />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
