import express from 'express';
import crypto from 'crypto';
import { getUserSession, updateUserSession, deleteUserSession, getSessionCount } from '../sessionStore.js';

const router = express.Router();

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SCOPES = ['playlist-read-private', 'playlist-read-collaborative', 'user-read-private'];

// Temporary store for PKCE verifiers (in production, use Redis or similar)
const pkceStore = new Map();

function generateCodeVerifier() {
  return crypto.randomBytes(64).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

router.get('/spotify', (req, res) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  // Generate a unique session token if it doesn't exist
  if (!req.session.sessionToken) {
    req.session.sessionToken = crypto.randomBytes(32).toString('base64url');
  }
  
  // Generate a state parameter to track this auth flow
  const state = crypto.randomBytes(16).toString('base64url');
  
  // Store BOTH verifier and session token with state as key
  pkceStore.set(state, { 
    verifier: codeVerifier, 
    sessionToken: req.session.sessionToken,
    timestamp: Date.now() 
  });
  setTimeout(() => pkceStore.delete(state), 10 * 60 * 1000);
  
  console.log('Spotify OAuth - Redirect URI:', process.env.SPOTIFY_REDIRECT_URI);
  console.log('Spotify OAuth - Client ID:', process.env.SPOTIFY_CLIENT_ID);
  console.log('Session Token:', req.session.sessionToken);
  console.log('State:', state);
  
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: SCOPES.join(' '),
    state: state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  });
  
  const authUrl = `${SPOTIFY_AUTH_URL}?${params}`;
  
  res.redirect(authUrl);
});

router.get('/spotify/callback', async (req, res) => {
  const { code, error, state } = req.query;
  
  console.log('Callback received. State:', state);
  
  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=${error}`);
  }
  
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
  }
  
  if (!state) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_state`);
  }
  
  // Retrieve verifier from store
  const storedData = pkceStore.get(state);
  
  if (!storedData) {
    console.error('No verifier found for state:', state);
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_verifier`);
  }
  
  const codeVerifier = storedData.verifier;
  const storedSessionToken = storedData.sessionToken;
  pkceStore.delete(state); // Use once and delete
  
  console.log('Code verifier retrieved successfully');
  console.log('Stored session token:', storedSessionToken);
  
  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        code_verifier: codeVerifier
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Spotify token error:', data);
      return res.redirect(`${process.env.FRONTEND_URL}?error=token_exchange_failed`);
    }
    
    // Use the stored session token from the initial request
    if (!req.session.sessionToken) {
      req.session.sessionToken = storedSessionToken;
    }
    
    const sessionToken = req.session.sessionToken;
    
    // Store Spotify token in our session store
    updateUserSession(sessionToken, {
      spotify_access_token: data.access_token,
      spotify_refresh_token: data.refresh_token,
      spotify_token_expiry: Date.now() + (data.expires_in * 1000)
    });
    
    console.log('Token received, storing with session token:', sessionToken);
    console.log('Session store now has:', getSessionCount(), 'sessions');
    
    // Save session and redirect with session token
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}?error=session_save_failed`);
      }
      console.log('Session saved, session ID:', req.sessionID);
      console.log('Redirecting to frontend with auth token');
      
      // Redirect with the session token so frontend can use it
      res.redirect(`${process.env.FRONTEND_URL}?auth=success&session_token=${sessionToken}`);
    });
    
  } catch (error) {
    console.error('Error exchanging code:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=server_error`);
  }
});

router.get('/spotify/status', (req, res) => {
  // Try to get session token from multiple sources
  const sessionToken = req.session.sessionToken || 
                       req.headers['x-session-token'] || 
                       req.query.session_token;
  
  console.log('Status check - Session ID:', req.sessionID);
  console.log('Status check - Session Token:', sessionToken);
  console.log('Status check - Session Store has:', getSessionCount(), 'sessions');
  
  if (!sessionToken) {
    console.log('No session token in request');
    return res.json({ authenticated: false });
  }
  
  const userSession = getUserSession(sessionToken);
  console.log('Status check - User session found:', !!userSession);
  
  if (userSession) {
    console.log('Session data:', {
      hasSpotifyToken: !!userSession.spotify_access_token,
      expiresAt: userSession.spotify_token_expiry
    });
  }
  
  if (!userSession || !userSession.spotify_access_token) {
    return res.json({ authenticated: false });
  }
  
  const isExpired = userSession.spotify_token_expiry 
    ? Date.now() > userSession.spotify_token_expiry 
    : true;
  
  res.json({
    authenticated: !isExpired,
    expiresAt: userSession.spotify_token_expiry
  });
});

router.post('/logout', (req, res) => {
  const sessionToken = req.session.sessionToken;
  if (sessionToken) {
    deleteUserSession(sessionToken);
  }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true });
  });
});

// Proxy endpoint to get user profile
router.get('/spotify/me', async (req, res) => {
  const sessionToken = req.session.sessionToken || 
                       req.headers['x-session-token'] || 
                       req.query.session_token;
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userSession = getUserSession(sessionToken);
  
  if (!userSession || !userSession.spotify_access_token) {
    return res.status(401).json({ error: 'No Spotify token found' });
  }
  
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${userSession.spotify_access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Proxy endpoint to get user playlists
router.get('/spotify/playlists', async (req, res) => {
  const sessionToken = req.session.sessionToken || 
                       req.headers['x-session-token'] || 
                       req.query.session_token;
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userSession = getUserSession(sessionToken);
  
  if (!userSession || !userSession.spotify_access_token) {
    return res.status(401).json({ error: 'No Spotify token found' });
  }
  
  try {
    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
      headers: {
        'Authorization': `Bearer ${userSession.spotify_access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// Proxy endpoint to get playlist tracks
router.get('/spotify/playlist/:playlistId/tracks', async (req, res) => {
  const sessionToken = req.session.sessionToken || 
                       req.headers['x-session-token'] || 
                       req.query.session_token;
  const { playlistId } = req.params;
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userSession = getUserSession(sessionToken);
  
  if (!userSession || !userSession.spotify_access_token) {
    return res.status(401).json({ error: 'No Spotify token found' });
  }
  
  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: {
        'Authorization': `Bearer ${userSession.spotify_access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    res.status(500).json({ error: 'Failed to fetch playlist tracks' });
  }
});

export default router;
