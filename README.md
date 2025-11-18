# Spotify → YouTube Playlist Converter

A full-stack web application that automates playlist migration from Spotify to YouTube with intelligent track matching, secure OAuth 2.0 authentication, and real-time progress tracking.

## 📋 Portfolio Summary

- **Full-stack application** with automated playlist migration from Spotify to YouTube using intelligent track matching via YouTube Data API
- **Secure OAuth 2.0 authentication** flow (PKCE for Spotify, standard OAuth for YouTube) with session management using Redis and Express middleware
- **Modern, responsive UI** with real-time conversion progress tracking, comprehensive error handling, and detailed per-track success/failure reporting

## ✨ Features

- **Modern, clean UI** with gradient accents and smooth animations
- **Dual OAuth 2.0 authentication** (Spotify PKCE + YouTube)
- **Automated playlist conversion** from Spotify to YouTube
- **Intelligent track matching** using YouTube search
- **Real-time progress tracking** and detailed conversion results
- **Redis-backed session management** for secure, persistent authentication
- **Express API proxy** to keep credentials secure server-side
- **Responsive design** for desktop and mobile

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, React Router
- **Backend:** Node.js, Express, Redis
- **APIs:** Spotify Web API, YouTube Data API v3
- **Auth:** OAuth 2.0 (PKCE for Spotify, standard for YouTube)
- **Styling:** Custom CSS with modern design system

## ⚡ Getting Started

### Prerequisites
- Node.js (v18+)
- Redis server running locally or remote connection
- Spotify API credentials
- YouTube API credentials

### 1. Clone the repository
```bash
git clone https://github.com/nemaansari/playlist-converter.git
cd playlist-converter/playlist-converter
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### 4. Start Redis
Make sure Redis is running:
```bash
# macOS (with Homebrew)
brew services start redis

# Linux
sudo systemctl start redis

# Or run directly
redis-server
```

### 5. Configure Environment Variables

**Backend** - Create `backend/.env`:
```bash
cd backend
cp .env.example .env
# Edit .env with your Spotify and YouTube API credentials
```

**Frontend** - Create `.env` (if needed):
```bash
# In root directory
cp .env.example .env
```

### 6. Run the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:3000`

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`

### 7. Open in Browser
Visit [http://localhost:5173](http://localhost:5173)

## 🎬 Demo

[![Watch Demo](thumbnail.png)](https://www.youtube.com/watch?v=7BMvPE5Pb8U)

Watch the full conversion process from Spotify authentication to YouTube playlist creation.

## 📝 Usage

1. **Login with Spotify** to authorize playlist access
2. **Login with YouTube** to enable playlist creation
3. **Select a Spotify playlist** and click "Convert to YouTube"
4. **Track conversion progress** and view your new YouTube playlist

## 🧑‍💻 Author

- [Nema Ansari](https://github.com/nemaansari)

## 📄 License

MIT
