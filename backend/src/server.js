import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import spotifyAuthRoutes from './routes/spotifyAuth.js';
import youtubeAuthRoutes from './routes/youtubeAuth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS must be configured BEFORE other middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'playlist_converter_session',
  cookie: {
    secure: false, // Set to false for local development (http)
    httpOnly: false, // Allow JavaScript access for debugging
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
  }
}));

app.get('/', (req, res) => {
  res.json({
    message: 'Playlist Converter API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', spotifyAuthRoutes);
app.use('/api/auth', youtubeAuthRoutes);
app.use('/api', spotifyAuthRoutes);

app.listen(PORT, () => {
  console.log(`\nServer running on http://localhost:${PORT}\n`);
});

app.use((err, req, res) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});
