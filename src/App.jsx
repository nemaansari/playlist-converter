import React from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Conversion from "./components/Conversion";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/convert/:playlistId" element={<Conversion />} />
      </Routes>
    </Router>
  );
}

export default App;
