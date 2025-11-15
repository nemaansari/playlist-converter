# Playlist Converter - Backend

Backend API server for the Playlist Converter application. Handles OAuth authentication, session management, and proxies requests to Spotify and YouTube APIs.

## Tech Stack

- **Node.js** with Express
- **OAuth 2.0** (PKCE for Spotify, standard for YouTube)
- **Express Session** for user session management
- **CORS** for cross-origin requests

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Add your API credentials to `.env`:
   - Get Spotify credentials from: https://developer.spotify.com/dashboard
   - Get YouTube credentials from: https://console.cloud.google.com/

4. Start the development server:
```bash
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /` - API status and version
- `GET /api/health` - Health check endpoint

### Authentication (Coming Soon)
- `GET /api/auth/spotify` - Initiate Spotify OAuth flow
- `GET /api/auth/spotify/callback` - Spotify OAuth callback
- `GET /api/auth/youtube` - Initiate YouTube OAuth flow
- `GET /api/auth/youtube/callback` - YouTube OAuth callback

## Environment Variables

See `.env.example` for required configuration.

## Security

- Client secrets stored server-side only
- HttpOnly cookies for session management
- CORS configured for frontend origin only
- Sessions expire after 24 hours
