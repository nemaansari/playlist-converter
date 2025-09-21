/**
 * YouTube Authentication and API Integration
 *
 * Comprehensive YouTube OAuth2 flow management and API operations.
 * Handles authentication, token management, playlist creation, and video addition.
 * Includes extensive debugging and error recovery mechanisms.
 */

import {
  YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET,
  YOUTUBE_REDIRECT_URI,
  YOUTUBE_AUTH_ENDPOINT,
  YOUTUBE_TOKEN_ENDPOINT,
  YOUTUBE_SCOPES,
} from "./youtubeConfig.js";

/**
 * Check if user is authenticated with YouTube
 * @returns {boolean} - True if access token exists in localStorage
 */
export const isYouTubeLoggedIn = () => {
  return !!localStorage.getItem("youtube_access_token");
};

/**
 * Initiate YouTube OAuth2 authentication flow
 * Validates environment configuration and redirects to Google OAuth
 */
export const loginToYouTube = async () => {
  // Debug environment variables to catch configuration issues
  console.log("YouTube Config Check:");
  console.log("Client ID:", YOUTUBE_CLIENT_ID);
  console.log("Client Secret exists:", !!YOUTUBE_CLIENT_SECRET);
  console.log("Redirect URI:", YOUTUBE_REDIRECT_URI);
  console.log("Scopes:", YOUTUBE_SCOPES);

  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
    alert(
      "YouTube configuration is missing. Please check your environment variables.",
    );
    return;
  }

  const authUrl =
    `${YOUTUBE_AUTH_ENDPOINT}?` +
    `client_id=${YOUTUBE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(YOUTUBE_SCOPES.join(" "))}`;

  console.log("Redirecting to:", authUrl);
  window.location.href = authUrl;
};

export const handleYouTubeCallback = async (code) => {
  try {
    console.log("Exchanging code for token...");
    console.log("Code:", code);
    console.log("Redirect URI:", YOUTUBE_REDIRECT_URI);
    console.log("Client ID:", YOUTUBE_CLIENT_ID);
    console.log("Client Secret exists:", !!YOUTUBE_CLIENT_SECRET);

    const params = new URLSearchParams({
      code: code,
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      redirect_uri: YOUTUBE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    console.log("Request params:", params.toString());

    const response = await fetch(YOUTUBE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries()),
    );

    const data = await response.json();
    console.log("Response data:", data);

    if (data.error) {
      console.error("YouTube OAuth Error:", data);
      return false;
    }

    if (!data.access_token) {
      console.error("No access token received:", data);
      return false;
    }

    console.log("Successfully received access token!");
    localStorage.setItem("youtube_access_token", data.access_token);

    if (data.refresh_token) {
      localStorage.setItem("youtube_refresh_token", data.refresh_token);
      console.log("Stored refresh token");
    }

    localStorage.setItem(
      "youtube_token_expiry",
      Date.now() + data.expires_in * 1000,
    );

    console.log("Token stored successfully, testing token...");

    // Test the token immediately after storing
    const testResult = await testYouTubeToken();
    console.log("Token test result:", testResult);

    return true;
  } catch (error) {
    console.error("YouTube OAuth Error:", error);
    return false;
  }
};

export const logoutFromYouTube = () => {
  localStorage.removeItem("youtube_access_token");
  localStorage.removeItem("youtube_refresh_token");
  localStorage.removeItem("youtube_token_expiry");
  console.log("YouTube authentication data cleared");
};

export const clearYouTubeAuth = () => {
  logoutFromYouTube();
  // Also clear any session storage
  sessionStorage.removeItem("youtube_return_playlist");
  sessionStorage.removeItem("youtube_return_playlist_name");
};

export const getYouTubeAccessToken = () => {
  return localStorage.getItem("youtube_access_token");
};

export const testYouTubeToken = async () => {
  const token = localStorage.getItem("youtube_access_token");

  if (!token) {
    return { valid: false, error: "No token found" };
  }

  try {
    // Test token by getting user's channel info
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (data.error) {
      return { valid: false, error: data.error.message, code: data.error.code };
    }

    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

export const refreshYouTubeToken = async () => {
  const refreshToken = localStorage.getItem("youtube_refresh_token");

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(YOUTUBE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      localStorage.setItem("youtube_access_token", data.access_token);

      if (data.refresh_token) {
        localStorage.setItem("youtube_refresh_token", data.refresh_token);
      }

      return true;
    } else {
      logoutFromYouTube();
      return false;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    return false;
  }
};

export const createYouTubePlaylist = async (name, description = "") => {
  const token = localStorage.getItem("youtube_access_token");

  if (!token) {
    throw new Error(
      "No YouTube access token found. Please login to YouTube first.",
    );
  }

  console.log(
    "Creating YouTube playlist with token:",
    token ? "Token exists" : "No token",
  );
  console.log("Playlist name:", name);

  const response = await fetch(
    "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          title: name,
          description: description,
          defaultLanguage: "en",
        },
        status: {
          privacyStatus: "private",
        },
      }),
    },
  );

  const data = await response.json();

  console.log("YouTube API Response:", data);
  console.log("Response status:", response.status);

  // Handle token expiry
  if (data.error && data.error.code === 401) {
    console.log("Token expired, attempting refresh...");
    const refreshed = await refreshYouTubeToken();
    if (refreshed) {
      console.log("Token refreshed, retrying playlist creation...");
      // Retry with new token
      return createYouTubePlaylist(name, description);
    } else {
      throw new Error(
        "YouTube token expired and refresh failed. Please re-authenticate.",
      );
    }
  }

  return data;
};

export const addVideoToPlaylist = async (playlistId, videoId) => {
  const token = localStorage.getItem("youtube_access_token");

  const response = await fetch(
    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          playlistId: playlistId,
          resourceId: {
            kind: "youtube#video",
            videoId: videoId,
          },
        },
      }),
    },
  );

  const data = await response.json();

  // Handle token expiry
  if (data.error && data.error.code === 401) {
    const refreshed = await refreshYouTubeToken();
    if (refreshed) {
      // Retry with new token
      return addVideoToPlaylist(playlistId, videoId);
    }
  }

  return data;
};
