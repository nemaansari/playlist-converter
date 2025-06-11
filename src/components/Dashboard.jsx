import React, { useState, useEffect } from "react";

const Dashboard = () => {
  const [user, setUser] = useState(null);
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
    <div style={{ padding: "20px" }}>
      <h2>Logged in as: {user?.display_name || "Loading..."}</h2>
      <button onClick={handleLogout}>Logout</button>

      <div style={{ marginTop: "20px" }}>
        <p>Playlist converter coming soon...</p>
      </div>
    </div>
  );
};

export default Dashboard;
