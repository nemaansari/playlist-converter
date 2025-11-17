import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "../config/api";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const sessionToken = localStorage.getItem('session_token');
        const headers = sessionToken ? { 'x-session-token': sessionToken } : {};
        
        // Check if user is authenticated
        const [spotifyRes, youtubeRes] = await Promise.all([
          fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH_SPOTIFY_STATUS}`, { 
            credentials: 'include',
            headers 
          }),
          fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH_YOUTUBE_STATUS}`, { 
            credentials: 'include',
            headers 
          })
        ]);
        
        const spotifyData = await spotifyRes.json();
        const youtubeData = await youtubeRes.json();
        
        if (!spotifyData.authenticated || !youtubeData.authenticated) {
          navigate("/");
          return;
        }

        const userRes = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SPOTIFY_ME}`, {
          credentials: 'include',
          headers
        });
        
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        } else {
          console.error('Failed to fetch user profile:', await userRes.text());
        }

        const playlistsRes = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SPOTIFY_PLAYLISTS}`, {
          credentials: 'include',
          headers
        });
        
        if (playlistsRes.ok) {
          const playlistsData = await playlistsRes.json();
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
      await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH_LOGOUT}`, {
        method: 'POST',
        credentials: 'include'
      });
      localStorage.removeItem('session_token');
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.removeItem('session_token');
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
    <div style={{ minHeight: '100vh', background: 'var(--secondary-bg)' }}>
      {/* Enhanced Header */}
      <header style={{
        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
        padding: '3rem 2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div>
              <div style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: '600'
              }}>
                Welcome Back
              </div>
              <h1 style={{
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                color: 'white',
                margin: 0,
                fontWeight: '700',
                lineHeight: 1.2
              }}>
                {user?.display_name || "Loading..."}
              </h1>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '0.75rem 2rem',
                fontWeight: '600'
              }}
            >
              Sign Out
            </button>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '1.5rem',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎵</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
                {playlists.length}
              </div>
              <div style={{ fontSize: '0.9375rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                Playlists Available
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '1.5rem',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎧</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
                {playlists.reduce((acc, p) => acc + (p.tracks?.total || 0), 0)}
              </div>
              <div style={{ fontSize: '0.9375rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                Total Tracks
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '1.5rem',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
                Ready
              </div>
              <div style={{ fontSize: '0.9375rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                Start Converting
              </div>
            </div>
          </div>
        </div>

        {/* Decorative gradient overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
      </header>

      {/* Main Content */}
      <main style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{
            fontSize: '1.875rem',
            marginBottom: '0.75rem',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block'
          }}>
            Your Playlists
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem' }}>
            Select a playlist to convert to YouTube Music
          </p>
        </div>

        {playlists.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--primary-bg)',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎵</div>
            <div className="loading" style={{ fontSize: '1.125rem' }}>
              <p>Loading your playlists...</p>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                style={{
                  background: 'var(--primary-bg)',
                  border: '2px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '0',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  boxShadow: 'var(--card-shadow)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)';
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                {/* Image Header */}
                <div style={{
                  position: 'relative',
                  height: '200px',
                  overflow: 'hidden',
                  background: playlist.images && playlist.images.length > 0
                    ? `url(${playlist.images[0].url})`
                    : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}>
                  {/* Gradient Overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)'
                  }} />

                  {/* Playlist Name Badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '1rem',
                    right: '1rem',
                    zIndex: 1
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontWeight: '600',
                      marginBottom: '0.25rem',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      Spotify Playlist
                    </div>
                    <div style={{
                      fontSize: '1.125rem',
                      color: 'white',
                      fontWeight: '700',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                    }}>
                      {playlist.name}
                    </div>
                  </div>

                  {/* Music Icon if no image */}
                  {(!playlist.images || playlist.images.length === 0) && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '4rem',
                      opacity: 0.3
                    }}>
                      🎵
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '1.75rem' }}>
                  <h4 style={{
                    fontSize: '1.25rem',
                    marginBottom: '0.75rem',
                    color: 'var(--text-primary)',
                    fontWeight: '700',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    minHeight: '2.5rem',
                    lineHeight: 1.3
                  }}>
                    {playlist.name}
                  </h4>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    padding: '0.75rem',
                    background: 'var(--secondary-bg)',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.125rem',
                      flexShrink: 0
                    }}>
                      🎧
                    </div>
                    <div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        lineHeight: 1
                      }}>
                        {playlist.tracks.total}
                      </div>
                      <div style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.2,
                        marginTop: '0.125rem'
                      }}>
                        Track{playlist.tracks.total !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/convert/${playlist.id}`, {
                        state: { name: playlist.name },
                      })
                    }
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      padding: '1rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    Convert Playlist →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
