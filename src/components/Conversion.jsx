import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const Conversion = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const playlistName = location.state?.name || `Unknown Playlist`;

  const token = localStorage.getItem("spotify_access_token");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const fetchTracks = async () => {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await response.json();
        setTracks(data.items);
      } catch (error) {
        console.error("Error fetching tracks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [playlistId, token, navigate]);

  if (loading) return <div>Loading tracks...</div>;

  return (
    <div className="center-content">
      <button onClick={() => navigate("/")}>← Back to Playlists</button>

      <h2>Converting: {playlistName}</h2>
      <p>Found {tracks.length} tracks</p>

      {tracks.map((item, index) => (
        <p key={index}>
          {item.track.name} - {item.track.artists[0].name}
        </p>
      ))}
    </div>
  );
};

export default Conversion;
