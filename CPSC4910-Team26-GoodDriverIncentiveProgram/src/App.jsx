import { Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import "./css/App.css";
import AboutMe from "./pages/AboutMe";
import Login from "./pages/Login";
import NavBar from "./components/NavBar";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<AboutMe />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
