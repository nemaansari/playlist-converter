import React, { useEffect } from "react";
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

  const spotifyToken = localStorage.getItem("spotify_access_token");
  const youtubeToken = localStorage.getItem("youtube_access_token");

  useEffect(() => {
    if (spotifyToken && youtubeToken) {
      navigate("/");
    }
  }, [spotifyToken, youtubeToken, navigate]);

  return (
    <div className="center-page">
      <h2>Playlist Converter</h2>
      <p>Convert your playlists between music platforms</p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {!spotifyToken && (
          <div>
            <div
              style={{
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "10px",
              }}
            >
              <img
                src={spotifyLogo}
                alt="Spotify Logo"
                className="spotify-logo"
                style={{
                  height: "100%",
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            </div>
            <button onClick={handleSpotifyLogin}>Login with Spotify</button>
          </div>
        )}

        {spotifyToken && !youtubeToken && (
          <div>
            <div
              style={{
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "10px",
              }}
            >
              <img
                src={youtubeLogo}
                alt="YouTube Logo"
                style={{
                  height: "100%",
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            </div>
            <button onClick={loginToYouTube}>Login with YouTube</button>
          </div>
        )}

        {spotifyToken && youtubeToken && (
          <div>
            <p>✅ All set! Loading dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
