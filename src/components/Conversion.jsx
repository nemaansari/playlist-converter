/**
 * Playlist Conversion Component
 *
 * Handles the complete Spotify to YouTube playlist conversion process.
 * Features:
 * - Fetches Spotify playlist tracks via Web API
 * - Searches for matching YouTube videos using Data API
 * - Creates new YouTube playlist with converted tracks
 * - Real-time progress tracking and detailed result reporting
 * - Comprehensive error handling and token validation
 * - Debug tools for troubleshooting authentication issues
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { searchYouTube } from "../youtubeSearch";
import {
  isYouTubeLoggedIn,
  loginToYouTube,
  createYouTubePlaylist,
  addVideoToPlaylist,
  testYouTubeToken,
  clearYouTubeAuth,
} from "../youtubeAuth";

const Conversion = () => {
  // Extract playlist ID from URL parameters
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Component state management
  const [tracks, setTracks] = useState([]); // Spotify tracks from the playlist
  const [loading, setLoading] = useState(true); // Initial data loading state
  const [testResult, setTestResult] = useState(null); // Results from test search

  // Comprehensive conversion state tracking
  const [conversionState, setConversionState] = useState({
    isConverting: false, // Whether conversion is currently running
    progress: 0, // Percentage completion (0-100)
    results: [], // Array of per-track conversion results
    playlistId: null, // Created YouTube playlist ID
    error: null, // Any conversion errors
  });

  // Get playlist name from navigation state or use fallback
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

  const handleYouTubeLogin = () => {
    sessionStorage.setItem("youtube_return_playlist", playlistId);
    sessionStorage.setItem("youtube_return_playlist_name", playlistName);
    loginToYouTube();
  };

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

  const convertPlaylist = async () => {
    if (!isYouTubeLoggedIn()) {
      alert("Please login to YouTube first");
      return;
    }

    setConversionState({
      isConverting: true,
      progress: 0,
      results: [],
      playlistId: null,
      error: null,
    });

    try {
      // Test YouTube token first
      console.log("Testing YouTube token...");
      const tokenTest = await testYouTubeToken();

      if (!tokenTest.valid) {
        throw new Error(
          `YouTube authentication invalid: ${tokenTest.error}. Please re-login to YouTube.`,
        );
      }

      console.log("YouTube token is valid, proceeding with conversion...");

      // Step 1: Create YouTube playlist
      console.log("Creating YouTube playlist...");
      const playlistResponse = await createYouTubePlaylist(
        `${playlistName} (from Spotify)`,
        `Converted from Spotify playlist: ${playlistName}`,
      );

      if (playlistResponse.error) {
        throw new Error(
          `Failed to create playlist: ${playlistResponse.error.message}`,
        );
      }

      const youtubePlaylistId = playlistResponse.id;
      console.log("Created playlist with ID:", youtubePlaylistId);

      setConversionState((prev) => ({
        ...prev,
        playlistId: youtubePlaylistId,
      }));

      // Step 2: Search and add each track
      const results = [];
      const totalTracks = tracks.length;

      for (let i = 0; i < totalTracks; i++) {
        const track = tracks[i].track;
        const searchQuery = `${track.name} ${track.artists[0].name}`;

        console.log(`Converting ${i + 1}/${totalTracks}: ${searchQuery}`);

        try {
          // Search for the track on YouTube
          const searchResult = await searchYouTube(searchQuery);

          if (searchResult && searchResult.id && searchResult.id.videoId) {
            // Add to YouTube playlist
            const addResult = await addVideoToPlaylist(
              youtubePlaylistId,
              searchResult.id.videoId,
            );

            if (addResult.error) {
              results.push({
                track: searchQuery,
                status: "error",
                error: addResult.error.message,
                youtubeTitle: searchResult.snippet.title,
              });
            } else {
              results.push({
                track: searchQuery,
                status: "success",
                youtubeTitle: searchResult.snippet.title,
                videoId: searchResult.id.videoId,
              });
            }
          } else {
            results.push({
              track: searchQuery,
              status: "not-found",
              error: "No matching video found on YouTube",
            });
          }
        } catch (error) {
          console.error(`Error processing track ${searchQuery}:`, error);
          results.push({
            track: searchQuery,
            status: "error",
            error: error.message,
          });
        }

        // Update progress
        const progress = Math.round(((i + 1) / totalTracks) * 100);
        setConversionState((prev) => ({
          ...prev,
          progress,
          results: [...results],
        }));

        // Rate limiting - wait between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Conversion complete
      setConversionState((prev) => ({
        ...prev,
        isConverting: false,
      }));

      console.log("Conversion completed!");
    } catch (error) {
      console.error("Conversion failed:", error);
      setConversionState((prev) => ({
        ...prev,
        isConverting: false,
        error: error.message,
      }));
    }
  };

  if (loading) return <div>Loading tracks...</div>;

  return (
    <div className="center-content">
      <button onClick={() => navigate("/")}>← Back to Playlists</button>

      <h2>Converting: {playlistName}</h2>
      <p>Found {tracks.length} tracks</p>

      <div style={{ marginTop: "20px" }}>
        {isYouTubeLoggedIn() ? (
          <div>
            <p>✅ Connected to YouTube</p>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                onClick={async () => {
                  console.log("Testing YouTube token...");
                  const test = await testYouTubeToken();
                  console.log("Token test result:", test);
                  if (test.valid) {
                    alert("YouTube token is valid!");
                  } else {
                    alert(`YouTube token error: ${test.error}`);
                  }
                }}
                style={{ fontSize: "12px", padding: "5px 10px" }}
              >
                Test YouTube Connection
              </button>
              <button
                onClick={() => {
                  if (confirm("Clear YouTube authentication and re-login?")) {
                    clearYouTubeAuth();
                    window.location.reload();
                  }
                }}
                style={{
                  fontSize: "12px",
                  padding: "5px 10px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                }}
              >
                Clear YouTube Auth
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p>❌ Not connected to YouTube</p>
            <button onClick={handleYouTubeLogin}>Login to YouTube</button>
          </div>
        )}
      </div>

      {tracks.length > 0 && isYouTubeLoggedIn() && (
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={testYouTubeSearch}
            disabled={conversionState.isConverting}
          >
            Test YouTube Search (First 3 Tracks)
          </button>

          <div style={{ marginTop: "10px" }}>
            <button
              onClick={convertPlaylist}
              disabled={conversionState.isConverting}
              style={{
                backgroundColor: conversionState.isConverting
                  ? "#6c757d"
                  : "#007bff",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "4px",
                cursor: conversionState.isConverting
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {conversionState.isConverting
                ? `Converting... ${conversionState.progress}%`
                : "Convert to YouTube Playlist"}
            </button>
          </div>

          {conversionState.isConverting && (
            <div style={{ marginTop: "10px" }}>
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#e9ecef",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${conversionState.progress}%`,
                    height: "20px",
                    backgroundColor: "#007bff",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <p>
                Converting {conversionState.results.length} of {tracks.length}{" "}
                tracks...
              </p>
            </div>
          )}

          {conversionState.error && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px",
                backgroundColor: "#f8d7da",
                color: "#721c24",
                border: "1px solid #f5c6cb",
                borderRadius: "4px",
              }}
            >
              <strong>Error:</strong> {conversionState.error}
            </div>
          )}

          {conversionState.playlistId && !conversionState.isConverting && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px",
                backgroundColor: "#d4edda",
                color: "#155724",
                border: "1px solid #c3e6cb",
                borderRadius: "4px",
              }}
            >
              <strong>✅ Conversion Complete!</strong>
              <br />
              <a
                href={`https://www.youtube.com/playlist?list=${conversionState.playlistId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#155724", textDecoration: "underline" }}
              >
                View Your New YouTube Playlist
              </a>
            </div>
          )}

          {conversionState.results.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h4>Conversion Results:</h4>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {conversionState.results.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      margin: "5px 0",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      backgroundColor:
                        result.status === "success"
                          ? "#d4edda"
                          : result.status === "not-found"
                            ? "#fff3cd"
                            : "#f8d7da",
                    }}
                  >
                    <div>
                      <strong>Track:</strong> {result.track}
                    </div>
                    {result.youtubeTitle && (
                      <div>
                        <strong>YouTube Match:</strong> {result.youtubeTitle}
                      </div>
                    )}
                    <div>
                      <strong>Status:</strong>
                      {result.status === "success" && " ✅ Added to playlist"}
                      {result.status === "not-found" && " ⚠️ No match found"}
                      {result.status === "error" &&
                        ` ❌ Error: ${result.error}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
        <h3>Track List:</h3>
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
