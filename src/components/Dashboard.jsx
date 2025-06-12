import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("spotify_access_token");

  useEffect(() => {
    if (token) {
      fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setPlaylists(data.items || []);
        })
        .catch((err) => {
          console.log("Playlist fetch error", err);
        });
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem(`spotify_access_token`);
    window.location.reload();
  };

  if (!token) {
    return <div>Please log in</div>;
  }

  return (
    <div className="center-content">
      <h2>Logged in as: {user?.display_name || "Loading..."}</h2>
      <button onClick={handleLogout}>Logout</button>

      <div style={{ marginTop: "30px" }}>
        <h3>Your Playlists ({playlists.length})</h3>
        {playlists.length === 0 ? (
          <p>Loading playlists...</p>
        ) : (
          <div>
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                style={{
                  margin: "10px 0",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                }}
              >
                <h4>{playlist.name}</h4>
                <p>{playlist.tracks.total} tracks</p>
                <button
                  onClick={() =>
                    navigate(`/convert/${playlist.id}`, {
                      state: { name: playlist.name },
                    })
                  }
                >
                  Convert
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
