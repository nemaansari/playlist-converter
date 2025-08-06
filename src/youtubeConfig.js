export const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
export const YOUTUBE_CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
export const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
export const YOUTUBE_REDIRECT_URI = "http://localhost:5173/youtube-callback";
export const YOUTUBE_AUTH_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
export const YOUTUBE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const YOUTUBE_SCOPES = ["https://www.googleapis.com/auth/youtube"];
export const SEARCH_ENDPOINT = `${YOUTUBE_API_BASE}/search`;
