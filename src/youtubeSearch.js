import { YOUTUBE_API_KEY, SEARCH_ENDPOINT } from "./youtubeConfig.js";

export const searchYouTube = async (query) => {
  const url = `http://localhost:3000/api/auth/youtube/search?q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('YouTube search error:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Search failed:", error);
    return null;
  }
};
