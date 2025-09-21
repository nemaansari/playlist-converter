/**
 * YouTube Search Utility
 *
 * Provides functions for searching YouTube videos using the Data API v3.
 * Used to find matching videos for Spotify tracks during playlist conversion.
 */

import { YOUTUBE_API_KEY, SEARCH_ENDPOINT } from "./youtubeConfig.js";

/**
 * Search for videos on YouTube using a text query
 * @param {string} query - Search query (typically "song title artist name")
 * @returns {Object|null} - First matching video result or null if not found
 */
export const searchYouTube = async (query) => {
  // Construct YouTube Data API search URL with parameters
  const url =
    `${SEARCH_ENDPOINT}?` +
    `part=snippet&` +
    `q=${encodeURIComponent(query)}&` +
    `type=video&` +
    `maxResults=1&` +
    `key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Check for API errors (quota exceeded, invalid key, etc.)
    if (data.error) {
      console.error("YouTube API Error:", data.error);
      return null;
    }

    // Return the first result, or null if no matches found
    return data.items?.[0] || null;
  } catch (error) {
    console.error("Search failed:", error);
    return null;
  }
};
