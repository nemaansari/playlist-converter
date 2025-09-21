import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import spotifyLogo from "../images/spotify-logo.png";
import youtubeLogo from "../images/youtube-logo.png";
import {
  CLIENT_ID,
  REDIRECT_URI,
  AUTH_ENDPOINT,
  SCOPES,
} from "../spotifyConfig";
import { loginToYouTube } from "../youtubeAuth";

const Login = () => {
  const navigate = useNavigate();

  // State to track authentication tokens
  const [spotifyToken, setSpotifyToken] = useState(
    localStorage.getItem("spotify_access_token"),
  );
  const [youtubeToken, setYoutubeToken] = useState(
    localStorage.getItem("youtube_access_token"),
  );

  // Monitor localStorage changes for token updates
  useEffect(() => {
    const handleStorageChange = () => {
      const newSpotifyToken = localStorage.getItem("spotify_access_token");
      const newYoutubeToken = localStorage.getItem("youtube_access_token");

      setSpotifyToken(newSpotifyToken);
      setYoutubeToken(newYoutubeToken);
    };

    // Listen for our custom token update events
    window.addEventListener("tokenUpdate", handleStorageChange);

    // Initial check
    handleStorageChange();

    return () => {
      window.removeEventListener("tokenUpdate", handleStorageChange);
    };
  }, []);

  // Navigate to dashboard when both tokens are available
  useEffect(() => {
    if (spotifyToken && youtubeToken) {
      console.log("Both tokens available, navigating to dashboard...");
      navigate("/");
    }
  }, [spotifyToken, youtubeToken, navigate]);

  const handleSpotifyLogin = async () => {
    const codeVerifier = btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    sessionStorage.setItem("spotify_code_verifier", codeVerifier);

    const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${SCOPES.join(" ")}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    window.location.href = authUrl;
  };

  return (
    <div className="center-page">
      <div className="glass-card">
        <h1>Playlist Converter</h1>
        <p>Convert your playlists seamlessly between music platforms</p>

        <div className="flex flex-col gap-4 mt-4">
          {!spotifyToken && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <img
                  src={spotifyLogo}
                  alt="Spotify Logo"
                  className="spotify-logo"
                />
              </div>
              <button onClick={handleSpotifyLogin}>Connect with Spotify</button>
            </div>
          )}

          {spotifyToken && !youtubeToken && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <img
                  src={youtubeLogo}
                  alt="YouTube Logo"
                  className="youtube-logo"
                />
              </div>
              <button onClick={loginToYouTube} className="youtube">
                Connect with YouTube
              </button>
            </div>
          )}

          {spotifyToken && youtubeToken && (
            <div className="text-center">
              <div className="status-success">
                <span>✅</span>
                <span>All connected! Loading dashboard...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
