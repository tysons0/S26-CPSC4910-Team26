import { Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import "./css/App.css";
import About from "./pages/About";
import Login from "./pages/Login";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import Sponsors from "./pages/Sponsors";
import Profile from "./pages/Profile";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<About />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Sponsors" element={<Sponsors />} />
        <Route path="/Profile" element={<Profile />} />
      </Routes>
    </>
  );
}

export default App;
