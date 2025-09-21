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
    <div className="center-page">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate("/")} className="secondary">
          ← Back to Playlists
        </button>
      </div>

      <div className="glass-card">
        <h2>Converting: {playlistName}</h2>
        <p className="text-muted">Found {tracks.length} tracks</p>

        <div className="mt-4">
          {isYouTubeLoggedIn() ? (
            <div className="text-center">
              <div className="status-success mb-3">
                <span>✅</span>
                <span>Connected to YouTube</span>
              </div>
              <div className="flex gap-2 justify-center">
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
                  className="secondary"
                  style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                >
                  Test Connection
                </button>
                <button
                  onClick={() => {
                    if (confirm("Clear YouTube authentication and re-login?")) {
                      clearYouTubeAuth();
                      window.location.reload();
                    }
                  }}
                  className="secondary"
                  style={{
                    fontSize: "0.875rem",
                    padding: "0.5rem 1rem",
                    background: "var(--accent-red)",
                  }}
                >
                  Clear Auth
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="status-error mb-3">
                <span>❌</span>
                <span>Not connected to YouTube</span>
              </div>
              <button onClick={handleYouTubeLogin} className="youtube">
                Connect to YouTube
              </button>
            </div>
          )}
        </div>

        {tracks.length > 0 && isYouTubeLoggedIn() && (
          <div className="mt-4">
            <button
              onClick={testYouTubeSearch}
              disabled={conversionState.isConverting}
              className="secondary mb-3"
            >
              Test YouTube Search (First 3 Tracks)
            </button>

            <div className="flex justify-center">
              <button
                onClick={convertPlaylist}
                disabled={conversionState.isConverting}
                className={`youtube ${conversionState.isConverting ? "loading" : ""}`}
                style={{
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
              <div className="progress-container mt-4">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${conversionState.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-muted">
                  Converting {conversionState.results.length} of {tracks.length}{" "}
                  tracks...
                </p>
              </div>
            )}

            {conversionState.error && (
              <div
                className="glass-card mt-4"
                style={{
                  background: "rgba(255, 0, 0, 0.1)",
                  borderColor: "var(--accent-red)",
                }}
              >
                <div className="status-error">
                  <span>❌</span>
                  <span>
                    <strong>Error:</strong> {conversionState.error}
                  </span>
                </div>
              </div>
            )}

            {conversionState.playlistId && !conversionState.isConverting && (
              <div
                className="glass-card mt-4"
                style={{
                  background: "rgba(29, 185, 84, 0.1)",
                  borderColor: "var(--accent-green)",
                }}
              >
                <div className="status-success text-center">
                  <span>✅</span>
                  <div>
                    <strong>Conversion Complete!</strong>
                    <br />
                    <a
                      href={`https://www.youtube.com/playlist?list=${conversionState.playlistId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "var(--accent-green)",
                        textDecoration: "underline",
                      }}
                    >
                      View Your New YouTube Playlist
                    </a>
                  </div>
                </div>
              </div>
            )}

            {conversionState.results.length > 0 && (
              <div className="glass-card mt-4">
                <h4 className="mb-3">Conversion Results:</h4>
                <div
                  style={{ maxHeight: "300px", overflowY: "auto" }}
                  className="flex flex-col gap-2"
                >
                  {conversionState.results.map((result, index) => (
                    <div
                      key={index}
                      className="glass-card"
                      style={{
                        background:
                          result.status === "success"
                            ? "rgba(29, 185, 84, 0.1)"
                            : result.status === "not-found"
                              ? "rgba(255, 193, 7, 0.1)"
                              : "rgba(255, 0, 0, 0.1)",
                        borderColor:
                          result.status === "success"
                            ? "var(--accent-green)"
                            : result.status === "not-found"
                              ? "#ffc107"
                              : "var(--accent-red)",
                      }}
                    >
                      <div className="text-left">
                        <div>
                          <strong>Track:</strong> {result.track}
                        </div>
                        {result.youtubeTitle && (
                          <div>
                            <strong>YouTube Match:</strong>{" "}
                            {result.youtubeTitle}
                          </div>
                        )}
                        <div
                          className={
                            result.status === "success"
                              ? "status-success"
                              : result.status === "not-found"
                                ? "status-warning"
                                : "status-error"
                          }
                        >
                          <strong>Status:</strong>
                          {result.status === "success" &&
                            " ✅ Added to playlist"}
                          {result.status === "not-found" &&
                            " ⚠️ No match found"}
                          {result.status === "error" &&
                            ` ❌ Error: ${result.error}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {testResult && Array.isArray(testResult) && (
              <div className="glass-card mt-4">
                <h4 className="mb-3">Search Results:</h4>
                <div className="flex flex-col gap-2">
                  {testResult.map((result, index) => (
                    <div
                      key={index}
                      className="glass-card"
                      style={{
                        background: result.success
                          ? "rgba(29, 185, 84, 0.1)"
                          : "rgba(255, 0, 0, 0.1)",
                        borderColor: result.success
                          ? "var(--accent-green)"
                          : "var(--accent-red)",
                      }}
                    >
                      <div className="text-left">
                        <div>
                          <strong>Original:</strong> {result.original}
                        </div>
                        <div>
                          <strong>Found:</strong> {result.found}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="glass-card mt-4">
          <h3 className="mb-3">Track Preview:</h3>
          <div className="text-left">
            {tracks.slice(0, 5).map((item, index) => (
              <p key={index} className="mb-1">
                {item.track.name} - {item.track.artists[0].name}
              </p>
            ))}
            {tracks.length > 5 && (
              <p className="text-muted">
                ... and {tracks.length - 5} more tracks
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversion;
