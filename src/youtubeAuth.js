import {
  YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET,
  YOUTUBE_REDIRECT_URI,
  YOUTUBE_AUTH_ENDPOINT,
  YOUTUBE_TOKEN_ENDPOINT,
  YOUTUBE_SCOPES,
} from "./youtubeConfig.js";

export const isYouTubeLoggedIn = () => {
  return !!localStorage.getItem("youtube_access_token");
};

export const loginToYouTube = async () => {
  const authUrl =
    `${YOUTUBE_AUTH_ENDPOINT}?` +
    `client_id=${YOUTUBE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(YOUTUBE_SCOPES.join(" "))}`;

  window.location.href = authUrl;
};

export const handleYouTubeCallback = async (code) => {
  try {
    console.log("Exchanging code for token...");
    console.log("Code:", code);
    console.log("Redirect URI:", YOUTUBE_REDIRECT_URI);

    const params = new URLSearchParams({
      code: code,
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      redirect_uri: YOUTUBE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const response = await fetch(YOUTUBE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await response.json();

    if (data.error) {
      console.error("YouTube OAuth Error:", data);
      return false;
    }

    localStorage.setItem("youtube_access_token", data.access_token);
    if (data.refresh_token) {
      localStorage.setItem("youtube_refresh_token", data.refresh_token);
    }
    localStorage.setItem(
      "youtube_token_expiry",
      Date.now() + data.expires_in * 1000,
    );

    return true;
  } catch (error) {
    console.error("YouTube OAuth Error:", error);
    return false;
  }
};

export const logoutFromYouTube = () => {
  localStorage.removeItem("youtube_access_token");
  localStorage.removeItem("youtube_refresh_token");
};

export const getYouTubeAccessToken = () => {
  return localStorage.getItem("youtube_access_token");
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
