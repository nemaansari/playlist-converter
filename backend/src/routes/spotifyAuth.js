import express from 'express';
import crypto from 'crypto';
import { getUserSession, updateUserSession, deleteUserSession } from '../sessionStore.js';

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
  
  if (!req.session.sessionToken) {
    req.session.sessionToken = crypto.randomBytes(32).toString('base64url');
  }
  
  const state = crypto.randomBytes(16).toString('base64url');
  
  // Store BOTH verifier and session token with state as key
  pkceStore.set(state, { 
    verifier: codeVerifier, 
    sessionToken: req.session.sessionToken,
    timestamp: Date.now() 
  });
  setTimeout(() => pkceStore.delete(state), 10 * 60 * 1000);
  
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
  
  
  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=${error}`);
  }
  
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
  }
  
  if (!state) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_state`);
  }
  
  const storedData = pkceStore.get(state);
  
  if (!storedData) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_verifier`);
  }
  
  const codeVerifier = storedData.verifier;
  const storedSessionToken = storedData.sessionToken;
  pkceStore.delete(state); // Use once and delete
  
  
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
      return res.redirect(`${process.env.FRONTEND_URL}?error=token_exchange_failed`);
    }
    
    if (!req.session.sessionToken) {
      req.session.sessionToken = storedSessionToken;
    }
    
    const sessionToken = req.session.sessionToken;
    
    // Store Spotify token in our session store
    await updateUserSession(sessionToken, {
      spotify_access_token: data.access_token,
      spotify_refresh_token: data.refresh_token,
      spotify_token_expiry: Date.now() + (data.expires_in * 1000)
    });
    
    
    req.session.save((err) => {
      if (err) {
        return res.redirect(`${process.env.FRONTEND_URL}?error=session_save_failed`);
      }
      
      res.redirect(`${process.env.FRONTEND_URL}?auth=success&session_token=${sessionToken}`);
    });
    
  } catch (error) {
    console.error('Error exchanging code:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=server_error`);
  }
});

router.get('/spotify/status', async (req, res) => {
  const sessionToken = req.session.sessionToken || 
                       req.headers['x-session-token'] || 
                       req.query.session_token;
  
  
  if (!sessionToken) {
    return res.json({ authenticated: false });
  }
  
  const userSession = await getUserSession(sessionToken);

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

router.post('/logout', async (req, res) => {
  const sessionToken = req.session.sessionToken;
  if (sessionToken) {
    await deleteUserSession(sessionToken);
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
  
  const userSession = await getUserSession(sessionToken);
  
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
  
  const userSession = await getUserSession(sessionToken);
  
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

// Proxy endpoint to get playlist tracks (with pagination support)
router.get('/spotify/playlist/:playlistId/tracks', async (req, res) => {
  const sessionToken = req.session.sessionToken ||
                       req.headers['x-session-token'] ||
                       req.query.session_token;
  const { playlistId } = req.params;

  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userSession = await getUserSession(sessionToken);

  if (!userSession || !userSession.spotify_access_token) {
    return res.status(401).json({ error: 'No Spotify token found' });
  }

  try {
    // Fetch all tracks by handling pagination
    let allTracks = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          'Authorization': `Bearer ${userSession.spotify_access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }

      const data = await response.json();
      allTracks = allTracks.concat(data.items);
      nextUrl = data.next; // Will be null when no more pages
    }

    // Return in the same format as the original API
    res.json({
      items: allTracks,
      total: allTracks.length
    });
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    res.status(500).json({ error: 'Failed to fetch playlist tracks' });
  }
});

export default router;
