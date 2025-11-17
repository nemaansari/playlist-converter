import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { API_CONFIG } from "../config/api";
import { searchYouTube } from "../youtubeSearch";
import {
  isYouTubeLoggedIn,
  loginToYouTube,
  createYouTubePlaylist,
  addVideoToPlaylist,
} from "../youtubeAuth";

const Conversion = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isYouTubeAuthenticated, setIsYouTubeAuthenticated] = useState(false);

  const [conversionState, setConversionState] = useState({
    isConverting: false,
    progress: 0,
    results: [],
    playlistId: null,
    error: null,
  });

  const playlistName = location.state?.name || `Unknown Playlist`;

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const sessionToken = localStorage.getItem('session_token');
        const headers = sessionToken ? { 'x-session-token': sessionToken } : {};
        
        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SPOTIFY_PLAYLIST_TRACKS}/${playlistId}/tracks`,
          {
            credentials: 'include',
            headers
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch tracks');
        }

        const data = await response.json();
        setTracks(data.items);
      } catch (error) {
        console.error("Error fetching tracks:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [playlistId, navigate]);

  useEffect(() => {
    const checkYouTubeAuth = async () => {
      const authenticated = await isYouTubeLoggedIn();
      setIsYouTubeAuthenticated(authenticated);
    };
    
    checkYouTubeAuth();
  }, []);

  const handleYouTubeLogin = () => {
    sessionStorage.setItem("youtube_return_playlist", playlistId);
    sessionStorage.setItem("youtube_return_playlist_name", playlistName);
    loginToYouTube();
  };

  const convertPlaylist = async () => {
    if (!await isYouTubeLoggedIn()) {
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

        try {
          const searchResult = await searchYouTube(searchQuery);

          if (searchResult && searchResult.id && searchResult.id.videoId) {
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

        const progress = Math.round(((i + 1) / totalTracks) * 100);
        setConversionState((prev) => ({
          ...prev,
          progress,
          results: [...results],
        }));

        // Rate limiting - wait between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setConversionState((prev) => ({
        ...prev,
        isConverting: false,
      }));
    } catch (error) {
      console.error("Conversion failed:", error);
      setConversionState((prev) => ({
        ...prev,
        isConverting: false,
        error: error.message,
      }));
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading" style={{ fontSize: '1.125rem' }}>
        <p>Loading tracks...</p>
      </div>
    </div>
  );

  const successCount = conversionState.results.filter(r => r.status === 'success').length;
  const errorCount = conversionState.results.filter(r => r.status === 'error').length;
  const notFoundCount = conversionState.results.filter(r => r.status === 'not-found').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--secondary-bg)' }}>
      {/* Header Section with Gradient */}
      <div style={{
        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
        padding: '3rem 2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '300px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />

        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              marginBottom: '2rem'
            }}
          >
            ← Back to Dashboard
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: '600'
            }}>
              Converting Playlist
            </div>
            <h1 style={{
              color: 'white',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              margin: '0 0 2rem',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
              {playlistName}
            </h1>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: conversionState.results.length > 0
                ? 'repeat(auto-fit, minmax(120px, 1fr))'
                : 'repeat(1, 1fr)',
              gap: '1rem',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '1.5rem 1rem'
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
                  {tracks.length}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>Total Tracks</div>
              </div>

              {conversionState.results.length > 0 && (
                <>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '16px',
                    padding: '1.5rem 1rem'
                  }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
                      {successCount}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>Converted</div>
                  </div>

                  {notFoundCount > 0 && (
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '16px',
                      padding: '1.5rem 1rem'
                    }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
                        {notFoundCount}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>Not Found</div>
                    </div>
                  )}

                  {errorCount > 0 && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '16px',
                      padding: '1.5rem 1rem'
                    }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
                        {errorCount}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>Errors</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>

        {/* Action Card */}
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          {!isYouTubeAuthenticated ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎵</div>
              <h3 style={{ marginBottom: '1rem' }}>Ready to Convert?</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Connect your YouTube account to start transferring your music
              </p>
              <button onClick={handleYouTubeLogin} className="youtube" style={{ padding: '1rem 3rem', fontSize: '1.125rem' }}>
                Connect YouTube Music
              </button>
            </div>
          ) : !conversionState.playlistId && !conversionState.isConverting ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Ready to Transfer!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Click below to start converting {tracks.length} tracks to YouTube Music
              </p>
              <button
                onClick={convertPlaylist}
                className="youtube"
                style={{ padding: '1rem 3rem', fontSize: '1.125rem' }}
              >
                Start Conversion
              </button>
            </div>
          ) : null}

          {conversionState.isConverting && (
            <div style={{ padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                <h3 style={{ marginBottom: '0.5rem' }}>Converting Your Playlist...</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Processing track {conversionState.results.length} of {tracks.length}
                </p>
              </div>
              <div className="progress-bar" style={{ height: '16px', marginBottom: '1rem' }}>
                <div
                  className="progress-fill"
                  style={{ width: `${conversionState.progress}%` }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <span>{conversionState.progress}% Complete</span>
                <span>{conversionState.results.length} / {tracks.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Error Card */}
        {conversionState.error && (
          <div className="glass-card" style={{
            marginBottom: '2rem',
            background: "rgba(239, 68, 68, 0.05)",
            borderColor: "#ef4444",
          }}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Conversion Error</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{conversionState.error}</p>
            </div>
          </div>
        )}

        {/* Success Card */}
        {conversionState.playlistId && !conversionState.isConverting && (
          <div className="glass-card" style={{
            marginBottom: '2rem',
            background: "rgba(16, 185, 129, 0.05)",
            borderColor: "#10b981",
          }}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>Conversion Complete!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Successfully converted {successCount} out of {tracks.length} tracks
              </p>
              <a
                href={`https://www.youtube.com/playlist?list=${conversionState.playlistId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <button className="youtube" style={{ padding: '1rem 3rem', fontSize: '1.125rem' }}>
                  Open in YouTube Music
                </button>
              </a>
            </div>
          </div>
        )}

        {/* Results Card */}
        {conversionState.results.length > 0 && !conversionState.isConverting && (
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Conversion Details</h3>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {conversionState.results.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      background: result.status === "success"
                        ? "rgba(16, 185, 129, 0.08)"
                        : result.status === "not-found"
                          ? "rgba(245, 158, 11, 0.08)"
                          : "rgba(239, 68, 68, 0.08)",
                      border: `2px solid ${
                        result.status === "success"
                          ? "#10b981"
                          : result.status === "not-found"
                            ? "#f59e0b"
                            : "#ef4444"
                      }`,
                      borderRadius: '12px',
                      padding: '1rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                        {result.status === "success" && "✅"}
                        {result.status === "not-found" && "⚠️"}
                        {result.status === "error" && "❌"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          {result.track}
                        </div>
                        {result.youtubeTitle && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            → {result.youtubeTitle}
                          </div>
                        )}
                        <div style={{
                          fontSize: '0.8125rem',
                          color: result.status === "success"
                            ? "#10b981"
                            : result.status === "not-found"
                              ? "#f59e0b"
                              : "#ef4444",
                          fontWeight: '500'
                        }}>
                          {result.status === "success" && "Added to playlist"}
                          {result.status === "not-found" && "No match found"}
                          {result.status === "error" && result.error}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Track Preview Card */}
        {!conversionState.isConverting && !conversionState.playlistId && (
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              Preview: First {Math.min(5, tracks.length)} Tracks
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tracks.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: 'var(--secondary-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.track.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.track.artists[0].name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {tracks.length > 5 && (
              <div style={{
                marginTop: '1rem',
                textAlign: 'center',
                padding: '1rem',
                background: 'var(--secondary-bg)',
                borderRadius: '12px',
                color: 'var(--text-secondary)',
                fontSize: '0.9375rem'
              }}>
                + {tracks.length - 5} more tracks
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversion;
