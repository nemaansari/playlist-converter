/**
 * YouTube API Configuration
 *
 * Centralizes all YouTube Data API v3 endpoints and OAuth2 settings.
 * Manages both OAuth authentication and API key-based operations.
 */

// YouTube API credentials from environment variables
export const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
export const YOUTUBE_CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
export const YOUTUBE_CLIENT_SECRET = import.meta.env.VITE_YOUTUBE_CLIENT_SECRET;

// YouTube API base URL and authentication endpoints
export const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
export const YOUTUBE_REDIRECT_URI = "http://127.0.0.1:5173/youtube-callback";
export const YOUTUBE_AUTH_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
export const YOUTUBE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

// OAuth2 scopes - full YouTube access for playlist creation and management
export const YOUTUBE_SCOPES = ["https://www.googleapis.com/auth/youtube"];

// YouTube Data API v3 endpoint configurations
export const SEARCH_ENDPOINT = `${YOUTUBE_API_BASE}/search`;
export const PLAYLISTS_ENDPOINT = `${YOUTUBE_API_BASE}/playlists`;
export const PLAYLIST_ITEMS_ENDPOINT = `${YOUTUBE_API_BASE}/playlistItems`;
