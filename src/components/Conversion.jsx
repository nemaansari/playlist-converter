import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { searchYouTube } from "../youtubeSearch";

const Conversion = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);
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

  const testYouTubeSearch = async () => {
    console.log("Testing first 3 tracks...");
    const results = [];

    for (let i = 0; i < Math.min(3, tracks.length); i++) {
      const track = tracks[i].track;
      const searchQuery = `${track.name} ${track.artists[0].name}`;

      console.log(`Searching ${i + 1}: ${searchQuery}`);
      const result = await searchYouTube(searchQuery);

      results.push({
        original: `${track.name} - ${track.artists[0].name}`,
        found: result ? result.snippet.title : "Not found",
        success: !!result,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setTestResult(results);
  };

  if (loading) return <div>Loading tracks...</div>;

  return (
    <div className="center-content">
      <button onClick={() => navigate("/")}>← Back to Playlists</button>

      <h2>Converting: {playlistName}</h2>
      <p>Found {tracks.length} tracks</p>

      {tracks.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <button onClick={testYouTubeSearch}>
            Test YouTube Search (First 3 Tracks)
          </button>

          {testResult && Array.isArray(testResult) && (
            <div style={{ marginTop: "10px" }}>
              <h4>Search Results:</h4>
              {testResult.map((result, index) => (
                <div
                  key={index}
                  style={{
                    margin: "5px 0",
                    padding: "8px",
                    border: "1px solid #ccc",
                    backgroundColor: result.success ? "#d4edda" : "#f8d7da",
                  }}
                >
                  <div>
                    <strong>Original:</strong> {result.original}
                  </div>
                  <div>
                    <strong>Found:</strong> {result.found}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        {tracks.slice(0, 5).map((item, index) => (
          <p key={index}>
            {item.track.name} - {item.track.artists[0].name}
          </p>
        ))}
        {tracks.length > 5 && <p>... and {tracks.length - 5} more</p>}
      </div>
    </div>
  );
};

export default Conversion;
