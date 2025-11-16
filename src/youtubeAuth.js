import {
  YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET,
  YOUTUBE_REDIRECT_URI,
  YOUTUBE_AUTH_ENDPOINT,
  YOUTUBE_TOKEN_ENDPOINT,
  YOUTUBE_SCOPES,
} from "./youtubeConfig.js";

export const isYouTubeLoggedIn = async () => {
  try {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return false;
    
    const response = await fetch('http://localhost:3000/api/auth/youtube/status', {
      credentials: 'include',
      headers: {
        'x-session-token': sessionToken
      }
    });
    
    const data = await response.json();
    return data.authenticated;
  } catch (error) {
    console.error('Error checking YouTube login:', error);
    return false;
  }
};

export const loginToYouTube = () => {
  window.location.href = 'http://localhost:3000/api/auth/youtube';
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

    // Trigger a custom event to notify other components of token change
    window.dispatchEvent(new CustomEvent("tokenUpdate"));

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
  const sessionToken = localStorage.getItem('session_token');
  
  if (!sessionToken) {
    throw new Error('Not authenticated. Please login to YouTube first.');
  }

  const response = await fetch(
    'http://localhost:3000/api/auth/youtube/playlists/create',
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken
      },
      body: JSON.stringify({ name, description })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to create playlist');
  }

  return await response.json();
};

export const addVideoToPlaylist = async (playlistId, videoId) => {
  const sessionToken = localStorage.getItem('session_token');
  
  if (!sessionToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `http://localhost:3000/api/auth/youtube/playlists/${playlistId}/add`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken
      },
      body: JSON.stringify({ videoId })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to add video');
  }

  return await response.json();
};
