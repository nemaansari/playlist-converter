import React from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Callback from "./components/Callback";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// http://127.0.0.1:5173/

function App() {
  const isLoggedIn = localStorage.getItem("spotify_access_token");

  console.log("App.jsx - Token check:", !!isLoggedIn);
  console.log("App.jsx - Will show:", isLoggedIn ? "Dashboard" : "Login");

  return (
    <Router>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Dashboard /> : <Login />} />
        <Route path="/callback" element={<Callback />} />
      </Routes>
    </Router>
  );
}

export default App;
