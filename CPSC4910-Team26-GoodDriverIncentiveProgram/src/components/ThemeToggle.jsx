import { useState, useEffect } from "react";
import "../css/ThemeToggle.css";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.body.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <button onClick={() => setIsDark(prev => !prev)} className="theme-toggle">
      <span className="icon">
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}

export default ThemeToggle;