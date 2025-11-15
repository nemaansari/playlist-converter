import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = 'http://localhost:3000';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    const checkAuthAndFetchData = async () => {
      try {
        const sessionToken = localStorage.getItem('session_token');
        const headers = sessionToken ? { 'x-session-token': sessionToken } : {};
        
        // Check if user is authenticated
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
        
        // If not authenticated, redirect to login
        if (!spotifyData.authenticated || !youtubeData.authenticated) {
          navigate("/");
          return;
        }

        // Fetch user profile via backend
        const userRes = await fetch(`${API_BASE}/api/spotify/me`, {
          credentials: 'include',
          headers
        });
        
        console.log('User profile response status:', userRes.status);
        
        if (userRes.ok) {
          const userData = await userRes.json();
          console.log('User data received:', userData);
          setUser(userData);
        } else {
          console.error('Failed to fetch user profile:', await userRes.text());
        }

        // Fetch playlists via backend
        const playlistsRes = await fetch(`${API_BASE}/api/spotify/playlists`, {
          credentials: 'include',
          headers
        });
        
        console.log('Playlists response status:', playlistsRes.status);
        
        if (playlistsRes.ok) {
          const playlistsData = await playlistsRes.json();
          console.log('Playlists data received:', playlistsData);
          setPlaylists(playlistsData.items || []);
        } else {
          console.error('Failed to fetch playlists:', await playlistsRes.text());
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="center-page">
        <div className="loading">
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="center-page">
      <div className="glass-card text-center">
        <h2>Welcome back, {user?.display_name || "Loading..."}!</h2>
        <p>Ready to convert your playlists to YouTube?</p>
        <button onClick={handleLogout} className="secondary mt-2">
          Logout
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="glass-card">
          <h3>Your Spotify Playlists</h3>
          <p className="text-muted mb-3">
            {playlists.length} playlist{playlists.length !== 1 ? "s" : ""} found
          </p>

          {playlists.length === 0 ? (
            <div className="loading">
              <p>Loading your playlists...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="playlist-card">
                  <div className="flex justify-between items-center">
                    <div className="text-left">
                      <h4 className="mb-1">{playlist.name}</h4>
                      <p className="text-muted">
                        {playlist.tracks.total} track
                        {playlist.tracks.total !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        navigate(`/convert/${playlist.id}`, {
                          state: { name: playlist.name },
                        })
                      }
                      className="youtube"
                    >
                      Convert to YouTube
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
