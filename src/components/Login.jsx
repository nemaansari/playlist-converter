import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import spotifyLogo from "../images/spotify-logo.png";
import youtubeLogo from "../images/youtube-logo.png";

const API_BASE = 'http://localhost:3000';

const Login = () => {
  const navigate = useNavigate();

  const [spotifyAuth, setSpotifyAuth] = useState(false);
  const [youtubeAuth, setYoutubeAuth] = useState(false);

  useEffect(() => {
    // Check if we just returned from OAuth with a session token
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = urlParams.get('session_token');
    
    console.log('Login component - URL params:', window.location.search);
    console.log('Login component - Session token from URL:', sessionToken);
    
    if (sessionToken) {
      // Store the session token in localStorage
      localStorage.setItem('session_token', sessionToken);
      console.log('Login component - Session token stored in localStorage');
      // Clean up the URL
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionToken = localStorage.getItem('session_token');
        console.log('Login component - Checking auth with session token:', sessionToken ? 'present' : 'missing');
        const headers = sessionToken ? { 'x-session-token': sessionToken } : {};
        
        const [spotifyRes, youtubeRes] = await Promise.all([
          fetch(`${API_BASE}/api/auth/spotify/status`, { 
            credentials: 'include',
            headers 
          }),
          fetch(`${API_BASE}/api/auth/youtube/status`, { 
            credentials: 'include',
            headers 
          })
        ]);
        
        const spotifyData = await spotifyRes.json();
        const youtubeData = await youtubeRes.json();
        
        console.log('Login component - Auth status:', { spotify: spotifyData.authenticated, youtube: youtubeData.authenticated });
        
        setSpotifyAuth(spotifyData.authenticated);
        setYoutubeAuth(youtubeData.authenticated);
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (spotifyAuth && youtubeAuth) {
      navigate("/dashboard");
    }
  }, [spotifyAuth, youtubeAuth, navigate]);

  const handleSpotifyLogin = () => {
    window.location.href = `${API_BASE}/api/auth/spotify`;
  };

  const handleYouTubeLogin = () => {
    window.location.href = `${API_BASE}/api/auth/youtube`;
  };

  return (
    <div className="center-page">
      <div className="glass-card">
        <h1>Playlist Converter</h1>
        <p>Convert your playlists seamlessly between music platforms</p>

        <div className="flex flex-col gap-4 mt-4">
          {!spotifyAuth && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <img
                  src={spotifyLogo}
                  alt="Spotify Logo"
                  className="spotify-logo"
                />
              </div>
              <button onClick={handleSpotifyLogin}>Connect with Spotify</button>
            </div>
          )}

          {spotifyAuth && !youtubeAuth && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <img
                  src={youtubeLogo}
                  alt="YouTube Logo"
                  className="youtube-logo"
                />
              </div>
              <button onClick={handleYouTubeLogin} className="youtube">
                Connect with YouTube
              </button>
            </div>
          )}

          {spotifyAuth && youtubeAuth && (
            <div className="text-center">
              <div className="status-success">
                <span>✅</span>
                <span>All connected! Loading dashboard...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

