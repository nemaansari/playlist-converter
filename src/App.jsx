import React from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Callback from "./components/Callback";
import Conversion from "./components/Conversion";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// http://127.0.0.1:5173/
import YouTubeCallback from "./components/YouTubeCallback";

function App() {
  const spotifyToken = localStorage.getItem("spotify_access_token");
  const youtubeToken = localStorage.getItem("youtube_access_token");

  const isLoggedIn = spotifyToken && youtubeToken;

  console.log("App.jsx - Token check:", !!isLoggedIn);
  console.log("App.jsx - Will show:", isLoggedIn ? "Dashboard" : "Login");

  return (
    <Router>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Dashboard /> : <Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/convert/:playlistId" element={<Conversion />} />
        <Route path="/youtube-callback" element={<YouTubeCallback />} />
      </Routes>
    </Router>
  );
}

export default App;
