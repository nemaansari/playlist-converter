import express from 'express';
import crypto from 'crypto';
import { getUserSession, updateUserSession, getSessionCount } from '../sessionStore.js';

const router = express.Router();

const YOUTUBE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const YOUTUBE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = ['https://www.googleapis.com/auth/youtube'];

// Store for state parameters (maps state to session token)
const stateStore = new Map();

router.get('/youtube', (req, res) => {
  // Generate or reuse session token
  if (!req.session.sessionToken) {
    req.session.sessionToken = crypto.randomBytes(32).toString('base64url');
  }
  
  // Generate state parameter for CSRF protection
  const state = crypto.randomBytes(16).toString('base64url');
  
  // Store state with session token (instead of in session)
  stateStore.set(state, {
    sessionToken: req.session.sessionToken,
    timestamp: Date.now()
  });
  
  // Auto-cleanup after 10 minutes
  setTimeout(() => stateStore.delete(state), 10 * 60 * 1000);
  
  const params = new URLSearchParams({
    client_id: process.env.YOUTUBE_CLIENT_ID,
    redirect_uri: process.env.YOUTUBE_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: state
  });
  
  res.redirect(`${YOUTUBE_AUTH_URL}?${params}`);
});

router.get('/youtube/callback', async (req, res) => {
  const { code, error, state } = req.query;
  
  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=${error}`);
  }
  
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
  }
  
  if (!state) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_state`);
  }
  
  // Retrieve session token from state store
  const storedData = stateStore.get(state);
  
  if (!storedData) {
    console.error('No state data found for state:', state);
    return res.redirect(`${process.env.FRONTEND_URL}?error=invalid_state`);
  }
  
  const sessionToken = storedData.sessionToken;
  stateStore.delete(state); // Use once and delete
  
  try {
    const response = await fetch(YOUTUBE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        redirect_uri: process.env.YOUTUBE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('YouTube token error:', data);
      return res.redirect(`${process.env.FRONTEND_URL}?error=token_exchange_failed`);
    }
    
    // Ensure session has the session token
    if (!req.session.sessionToken) {
      req.session.sessionToken = sessionToken;
    }
    
    // Store YouTube token in session store
    await updateUserSession(sessionToken, {
      youtube_access_token: data.access_token,
      youtube_refresh_token: data.refresh_token,
      youtube_token_expiry: Date.now() + (data.expires_in * 1000)
    });
    
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}?error=session_save_failed`);
      }
      
      // Redirect with the session token
      res.redirect(`${process.env.FRONTEND_URL}?auth=success&session_token=${sessionToken}`);
    });
    
  } catch (error) {
    console.error('Error exchanging code:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=server_error`);
  }
});

router.get('/youtube/status', async (req, res) => {
  // Try to get session token from multiple sources
  const sessionToken = req.session.sessionToken || 
                       req.headers['x-session-token'] || 
                       req.query.session_token;
  
  if (!sessionToken) {
    return res.json({ authenticated: false });
  }
  
  const userSession = await getUserSession(sessionToken);
  
  if (!userSession || !userSession.youtube_access_token) {
    return res.json({ authenticated: false });
  }
  
  const isExpired = userSession.youtube_token_expiry 
    ? Date.now() > userSession.youtube_token_expiry 
    : true;
  
  res.json({
    authenticated: !isExpired,
    expiresAt: userSession.youtube_token_expiry
  });
});

router.post('/youtube/refresh', async (req, res) => {
  const refreshToken = req.session.youtube_refresh_token;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }
  
  try {
    const response = await fetch(YOUTUBE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      return res.status(401).json({ error: 'Failed to refresh token' });
    }
    
    req.session.youtube_access_token = data.access_token;
    req.session.youtube_token_expiry = Date.now() + (data.expires_in * 1000);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/youtube/playlists/create', async (req, res) => {
  const sessionToken = req.session.sessionToken || 
                       req.headers['x-session-token'] || 
                       req.query.session_token;
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userSession = await getUserSession(sessionToken);
  
  if (!userSession || !userSession.youtube_access_token) {
    return res.status(401).json({ error: 'No YouTube token found' });
  }
  
  const { name, description } = req.body;
  
  try {
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userSession.youtube_access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snippet: {
            title: name,
            description: description || '',
            defaultLanguage: 'en'
          },
          status: {
            privacyStatus: 'private'
          }
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error:', errorData);
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error creating YouTube playlist:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

router.post('/youtube/playlists/:playlistId/add', async (req, res) => {
  const sessionToken = req.session.sessionToken || 
                       req.headers['x-session-token'] || 
                       req.query.session_token;
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userSession = await getUserSession(sessionToken);
  
  if (!userSession || !userSession.youtube_access_token) {
    return res.status(401).json({ error: 'No YouTube token found' });
  }
  
  const { playlistId } = req.params;
  const { videoId } = req.body;
  
  try {
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userSession.youtube_access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId
            }
          }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error adding video to playlist:', error);
    res.status(500).json({ error: 'Failed to add video' });
  }
});

router.get('/youtube/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }
  
  if (!process.env.YOUTUBE_API_KEY) {
    console.error('YOUTUBE_API_KEY is not set in environment variables!');
    return res.status(500).json({ error: 'YouTube API key not configured' });
  }
  
  try {
    const url = 
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&` +
      `q=${encodeURIComponent(q)}&` +
      `type=video&` +
      `maxResults=1&` +
      `key=${process.env.YOUTUBE_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error:', errorData);
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    const result = data.items?.[0] || null;
    
    res.json(result);
  } catch (error) {
    console.error('Error searching YouTube:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

export default router;
