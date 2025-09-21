/**
 * Main Application Component
 *
 * Root component that handles routing and authentication state management.
 * Determines whether to show login or dashboard based on OAuth token presence.
 */

import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Callback from "./components/Callback";
import Conversion from "./components/Conversion";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import YouTubeCallback from "./components/YouTubeCallback";

function App() {
  // State to track authentication tokens
  const [spotifyToken, setSpotifyToken] = useState(
    localStorage.getItem("spotify_access_token"),
  );
  const [youtubeToken, setYoutubeToken] = useState(
    localStorage.getItem("youtube_access_token"),
  );

  // Monitor localStorage changes for token updates
  useEffect(() => {
    const handleStorageChange = () => {
      const newSpotifyToken = localStorage.getItem("spotify_access_token");
      const newYoutubeToken = localStorage.getItem("youtube_access_token");

      setSpotifyToken(newSpotifyToken);
      setYoutubeToken(newYoutubeToken);
    };

    // Listen for storage events (both cross-tab changes and our custom events)
    window.addEventListener("storage", handleStorageChange);

    // Listen for a custom event we'll dispatch when tokens change
    window.addEventListener("tokenUpdate", handleStorageChange);

    // Initial check on mount
    handleStorageChange();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tokenUpdate", handleStorageChange);
    };
  }, []);

  // User is fully authenticated only when both services are connected
  const isLoggedIn = spotifyToken && youtubeToken;

  // Debug logging for authentication state
  console.log("App.jsx - Token check:", !!isLoggedIn);
  console.log("App.jsx - Spotify token:", !!spotifyToken);
  console.log("App.jsx - YouTube token:", !!youtubeToken);
  console.log("App.jsx - Will show:", isLoggedIn ? "Dashboard" : "Login");

  return (
    <Router>
      <Routes>
        {/* Main route: login screen or dashboard based on auth status */}
        <Route path="/" element={isLoggedIn ? <Dashboard /> : <Login />} />

        {/* OAuth callback handlers for each service */}
        <Route path="/callback" element={<Callback />} />
        <Route path="/youtube-callback" element={<YouTubeCallback />} />

        {/* Playlist conversion page */}
        <Route path="/convert/:playlistId" element={<Conversion />} />
      </Routes>
    </Router>
  );
}

export default App;
