/**
 * Spotify API Configuration
 *
 * Centralizes all Spotify-related API endpoints and authentication settings.
 * Uses Vite environment variables for secure credential management.
 */

// Spotify OAuth2 credentials from environment variables
export const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
export const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;

// Spotify Web API endpoints
export const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
export const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

// Required permissions for reading user playlists
export const SCOPES = ["playlist-read-private", "playlist-read-collaborative"];
