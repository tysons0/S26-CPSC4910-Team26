import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiService from "../services/api";
import PageTitle from "../components/PageTitle";
import "../css/Login.css";

const LOGIN_RATE_LIMIT_STORAGE_KEY = "loginRateLimitState";
const MAX_LOGIN_PRESSES = 5;
const PRESS_WINDOW_MS = 30 * 1000;
const LOCKOUT_MS = 2 * 60 * 1000;

const getRateLimitState = () => {
  try {
    const savedState = localStorage.getItem(LOGIN_RATE_LIMIT_STORAGE_KEY);
    if (!savedState) {
      return { attemptTimestamps: [], lockUntil: 0 };
    }

    const parsedState = JSON.parse(savedState);
    return {
      attemptTimestamps: Array.isArray(parsedState.attemptTimestamps)
        ? parsedState.attemptTimestamps.filter((timestamp) => Number.isFinite(timestamp))
        : [],
      lockUntil: Number.isFinite(parsedState.lockUntil) ? parsedState.lockUntil : 0,
    };
  } catch {
    return { attemptTimestamps: [], lockUntil: 0 };
  }
};

const saveRateLimitState = (state) => {
  localStorage.setItem(LOGIN_RATE_LIMIT_STORAGE_KEY, JSON.stringify(state));
};

const formatRemainingTime = (remainingMs) => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockUntil, setLockUntil] = useState(() => {
    const { lockUntil: storedLockUntil } = getRateLimitState();
    return storedLockUntil > Date.now() ? storedLockUntil : 0;
  });
  const [remainingLockMs, setRemainingLockMs] = useState(0);

  const navigate = useNavigate();

  const isLocked = lockUntil > Date.now();
  const lockMessage = isLocked
    ? `Too many logon attempts. Please wait ${formatRemainingTime(remainingLockMs)} before trying again.`
    : "";
  const displayError = lockMessage || error;

  useEffect(() => {
    if (!lockUntil) {
      setRemainingLockMs(0);
      return;
    }

    const updateRemainingTime = () => {
      const nextRemainingMs = Math.max(lockUntil - Date.now(), 0);
      setRemainingLockMs(nextRemainingMs);

      if (nextRemainingMs === 0) {
        setLockUntil(0);
        const state = getRateLimitState();
        saveRateLimitState({
          attemptTimestamps: state.attemptTimestamps,
          lockUntil: 0,
        });
      }
    };

    updateRemainingTime();
    const intervalId = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(intervalId);
  }, [lockUntil]);

  const registerAttemptAndCheckLock = () => {
    const now = Date.now();
    const state = getRateLimitState();

    if (state.lockUntil > now) {
      return { locked: true, nextLockUntil: state.lockUntil };
    }

    const recentAttempts = state.attemptTimestamps.filter(
      (timestamp) => now - timestamp <= PRESS_WINDOW_MS,
    );
    const updatedAttempts = [...recentAttempts, now];

    if (updatedAttempts.length >= MAX_LOGIN_PRESSES) {
      const nextLockUntil = now + LOCKOUT_MS;
      saveRateLimitState({ attemptTimestamps: [], lockUntil: nextLockUntil });
      return { locked: true, nextLockUntil };
    }

    saveRateLimitState({ attemptTimestamps: updatedAttempts, lockUntil: 0 });
    return { locked: false, nextLockUntil: 0 };
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const { locked, nextLockUntil } = registerAttemptAndCheckLock();
    if (locked) {
      setLockUntil(nextLockUntil);
      setError(
        `Too many logon attempts. Please wait ${formatRemainingTime(
          Math.max(nextLockUntil - Date.now(), 0),
        )} before trying again.`,
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { user } = await apiService.login({ userName, password });

      localStorage.removeItem(LOGIN_RATE_LIMIT_STORAGE_KEY);
      setLockUntil(0);
      setRemainingLockMs(0);

      const role = user.role?.toLowerCase();

      window.dispatchEvent(new Event("authChange"));

      if (role === "admin") {
        navigate("/AdminDashboard");
      } else if (role === "driver") {
        navigate("/DriverDashboard");
      } else if (role === "sponsor") {
        navigate("/SponsorDashboard");
      } else {
        navigate("/About");
      }
    } catch (err) {
      
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <PageTitle title="Login | Team 26" />

      <div className="login-card">
        <h1>Login</h1>
        <p className="login-subtitle">Welcome back</p>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit" disabled={loading || isLocked}>
            {loading
              ? "Logging in..."
              : isLocked
                ? `Try again in ${formatRemainingTime(remainingLockMs)}`
                : "Login"}
          </button>

          {displayError && <p className="login-error">{displayError}</p>}
        </form>

        <div className="back-link">
          <p>
            Don't have an account? <Link to="/DriverSignUp">Sign Up Here</Link>
          </p>
          <p>
            <Link to="/">Back to About Page</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
