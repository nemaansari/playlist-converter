// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  ENDPOINTS: {
    // Spotify
    SPOTIFY_ME: '/api/spotify/me',
    SPOTIFY_PLAYLISTS: '/api/spotify/playlists',
    SPOTIFY_PLAYLIST_TRACKS: '/api/spotify/playlist',
    
    // YouTube
    YOUTUBE_SEARCH: '/api/auth/youtube/search',
    YOUTUBE_PLAYLISTS_CREATE: '/api/auth/youtube/playlists/create',
    YOUTUBE_PLAYLISTS_ADD: '/api/auth/youtube/playlists',
    
    // Auth
    AUTH_SPOTIFY: '/api/auth/spotify',
    AUTH_SPOTIFY_STATUS: '/api/auth/spotify/status',
    AUTH_YOUTUBE: '/api/auth/youtube',
    AUTH_YOUTUBE_STATUS: '/api/auth/youtube/status',
    AUTH_LOGOUT: '/api/auth/logout',
  }
};

// Helper function to build full URLs
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
