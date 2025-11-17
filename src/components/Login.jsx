import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "../config/api";
import spotifyLogo from "../images/spotify-logo.png";
import youtubeLogo from "../images/youtube-logo.png";

const Login = () => {
  const navigate = useNavigate();

  const [spotifyAuth, setSpotifyAuth] = useState(false);
  const [youtubeAuth, setYoutubeAuth] = useState(false);

  useEffect(() => {
    // Check if we just returned from OAuth with a session token
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = urlParams.get('session_token');
    
    if (sessionToken) {
      // Store the session token in localStorage
      localStorage.setItem('session_token', sessionToken);
      // Clean up the URL
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionToken = localStorage.getItem('session_token');
        const headers = sessionToken ? { 'x-session-token': sessionToken } : {};
        
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
        
        setSpotifyAuth(spotifyData.authenticated);
        setYoutubeAuth(youtubeData.authenticated);
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (spotifyAuth && youtubeAuth) {
      navigate("/dashboard");
    }
  }, [spotifyAuth, youtubeAuth, navigate]);

  const handleSpotifyLogin = () => {
    window.location.href = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH_SPOTIFY}`;
  };

  const handleYouTubeLogin = () => {
    window.location.href = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH_YOUTUBE}`;
  };

  return (
    <div className="center-page" style={{ background: 'var(--secondary-bg)' }}>
      <section style={{
        padding: '8rem 2rem 6rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '400px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'float 6s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-5%',
          width: '300px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          animation: 'float 8s ease-in-out infinite reverse'
        }} />

        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            padding: '0.5rem 1.5rem',
            borderRadius: '50px',
            marginBottom: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600', letterSpacing: '0.05em' }}>
              PLAYLIST CONVERTER
            </span>
          </div>

          <h1 style={{
            color: 'white',
            fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
            marginBottom: '1.5rem',
            textShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            Transfer Your Music Library<br />Between Platforms
          </h1>
          <p style={{
            fontSize: '1.375rem',
            marginBottom: '3rem',
            maxWidth: '700px',
            margin: '0 auto 3rem',
            color: 'rgba(255, 255, 255, 0.95)',
            textShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            The easiest way to move your playlists from Spotify to YouTube Music in just a few clicks.
          </p>

          {!spotifyAuth && !youtubeAuth && (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleSpotifyLogin}
                className="spotify"
                style={{
                  fontSize: '1.125rem',
                  padding: '1.25rem 3rem',
                  boxShadow: '0 8px 24px rgba(29, 185, 84, 0.4)'
                }}
              >
                Start for Free
              </button>
              <button
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  fontSize: '1.125rem',
                  padding: '1.25rem 3rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  color: 'white',
                  boxShadow: 'none'
                }}
              >
                Learn More
              </button>
            </div>
          )}

          {(spotifyAuth || youtubeAuth) && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(16, 185, 129, 0.2)',
              backdropFilter: 'blur(10px)',
              padding: '1rem 2rem',
              borderRadius: '50px',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              fontSize: '1.125rem',
              color: 'white',
              fontWeight: '600'
            }}>
              <span style={{ fontSize: '1.5rem' }}>✓</span>
              <span>Connected! Setting up your account...</span>
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '3rem',
            justifyContent: 'center',
            marginTop: '4rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>⚡ Fast</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>2-5 min average</div>
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>🔒 Secure</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>OAuth protected</div>
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>🎯 Accurate</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Smart matching</div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-20px) translateX(10px); }
          }
        `}</style>
      </section>

      <section id="how-it-works" style={{ padding: '4rem 2rem', background: 'var(--primary-bg)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2>How It Works</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
              Transfer your music in three simple steps
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            <div className="glass-card" style={{
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              border: '2px solid var(--border-color)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = 'var(--accent-green)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}>
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-green), #1ed760)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1.125rem'
              }}>
                1
              </div>

              <div style={{
                width: '100px',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                background: 'var(--secondary-bg)',
                borderRadius: '20px'
              }}>
                <img src={spotifyLogo} alt="Spotify" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
              </div>
              <h3 style={{ fontSize: '1.375rem', marginBottom: '0.75rem', fontWeight: '700' }}>Connect Spotify</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
                Link your Spotify account to access your playlists
              </p>
              {!spotifyAuth && (
                <button onClick={handleSpotifyLogin} className="spotify" style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }}>
                  Connect Spotify →
                </button>
              )}
              {spotifyAuth && (
                <div style={{
                  marginTop: '1.5rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '1rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  color: '#10b981',
                  fontWeight: '600'
                }}>
                  <span style={{ fontSize: '1.25rem' }}>✓</span>
                  <span>Connected</span>
                </div>
              )}
            </div>

            {/* Destination Card */}
            <div className="glass-card" style={{
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              border: '2px solid var(--border-color)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = 'var(--accent-red)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}>
              {/* Number badge */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-red), #ff3333)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1.125rem'
              }}>
                2
              </div>

              <div style={{
                width: '100px',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                background: 'var(--secondary-bg)',
                borderRadius: '20px'
              }}>
                <img src={youtubeLogo} alt="YouTube" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
              </div>
              <h3 style={{ fontSize: '1.375rem', marginBottom: '0.75rem', fontWeight: '700' }}>Connect YouTube</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
                Link YouTube Music as your destination platform
              </p>
              {spotifyAuth && !youtubeAuth && (
                <button onClick={handleYouTubeLogin} className="youtube" style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }}>
                  Connect YouTube →
                </button>
              )}
              {youtubeAuth && (
                <div style={{
                  marginTop: '1.5rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '1rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  color: '#10b981',
                  fontWeight: '600'
                }}>
                  <span style={{ fontSize: '1.25rem' }}>✓</span>
                  <span>Connected</span>
                </div>
              )}
              {!spotifyAuth && (
                <button disabled style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }}>
                  Connect Spotify First
                </button>
              )}
            </div>

            {/* Transfer Card */}
            <div className="glass-card" style={{
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              border: '2px solid var(--border-color)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}>
              {/* Number badge */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1.125rem'
              }}>
                3
              </div>

              <div style={{
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: '3rem'
              }}>
                ⚡
              </div>
              <h3 style={{ fontSize: '1.375rem', marginBottom: '0.75rem', fontWeight: '700' }}>Transfer Music</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
                Start the transfer and watch your music move instantly
              </p>
              {spotifyAuth && youtubeAuth ? (
                <div style={{
                  marginTop: '1.5rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '1rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  color: '#10b981',
                  fontWeight: '600'
                }}>
                  <span style={{ fontSize: '1.25rem' }}>✓</span>
                  <span>Ready to Transfer</span>
                </div>
              ) : (
                <button disabled style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }}>
                  Connect Both Services
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '4rem 2rem', background: 'var(--secondary-bg)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2>Why Choose Us?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
              Everything you need to manage your music across platforms
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
              <h4>Lightning Fast</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Transfer thousands of tracks in minutes with our optimized algorithm
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
              <h4>High Accuracy</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Advanced matching ensures your tracks are found correctly
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
              <h4>Secure & Private</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Your data is encrypted and never stored on our servers
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;

