import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const navigate = useNavigate();

  const spotifyToken = localStorage.getItem("spotify_access_token");
  const youtubeToken = localStorage.getItem("youtube_access_token");

  useEffect(() => {
    if (spotifyToken) {
      fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      })
        .then((res) => {
          console.log("API status:", res.status);
          if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("User data received:", data);
          setUser(data);
        })
        .catch((err) => {
          console.log("Fetch error:", err);
          localStorage.removeItem("spotify_access_token");
          window.location.reload();
        });

      fetch("https://api.spotify.com/v1/me/playlists?limit=20", {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setPlaylists(data.items || []);
        })
        .catch((err) => {
          console.log("Playlist fetch error", err);
        });
    }
  }, [spotifyToken]);

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token");
    window.location.reload();
  };

  if (!spotifyToken || !youtubeToken) {
    return <div>Please log in to both Spotify and YouTube</div>;
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
