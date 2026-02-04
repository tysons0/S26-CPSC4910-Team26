import { Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import "./css/App.css";
import AboutMe from "./pages/AboutMe";
import Login from "./pages/Login";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<AboutMe />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

export default App;
