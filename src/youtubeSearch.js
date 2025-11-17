import { API_CONFIG } from './config/api';

export const searchYouTube = async (query) => {
  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.YOUTUBE_SEARCH}?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('YouTube search error:', response.status);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Search failed:", error);
    return null;
  }
};
