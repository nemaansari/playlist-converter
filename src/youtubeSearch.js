import { YOUTUBE_API_KEY, SEARCH_ENDPOINT } from "./youtubeConfig.js";

export const searchYouTube = async (query) => {
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

    if (data.error) {
      console.error("YouTube API Error:", data.error);
      return null;
    }

    return data.items?.[0] || null;
  } catch (error) {
    console.error("Search failed:", error);
    return null;
  }
};
