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
