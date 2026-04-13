import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function SessionGuard() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleExpiry = () => setShow(true);
    window.addEventListener("session:expired", handleExpiry);
    return () => window.removeEventListener("session:expired", handleExpiry);
  }, []);

  if (!show) return null;

  const handleLogin = () => {
    // Clear everything out
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    setShow(false);
    sessionStorage.clear();
    navigate("/login"); // adjust to your login route
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--surface-alt, #1a1d27)",
          border: "1px solid var(--border, #2d3148)",
          borderRadius: "14px",
          padding: "2rem 2.5rem",
          maxWidth: "380px",
          width: "90%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⏱</div>
        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--text-muted, #e2e8f0)",
            marginBottom: "0.5rem",
          }}
        >
          Session Expired
        </div>
        <div
          style={{
            fontSize: "0.9rem",
            color: "var(--text-alt, #a0aec0)",
            marginBottom: "1.75rem",
            lineHeight: 1.6,
          }}
        >
          Your session has timed out. Please log back in to continue.
        </div>
        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "8px",
            border: "none",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Log Back In
        </button>
      </div>
    </div>
  );
}

export default SessionGuard;
