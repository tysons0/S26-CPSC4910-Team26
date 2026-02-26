import { useState, useEffect } from "react";
import apiService from "../services/api";
import "../css/NotificationBell.css";

function NotificationBell() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [tokenInfo, setTokenInfo] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notificationData = await apiService.getNotifications();
        console.log("Fetched notifications:", notificationData);

        setNotifications(notificationData ?? []);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };
    const fetchTokenInfo = async () => {
      // CHANGE THIS TO RETRIEVE EXPIRY ETC.
      try {
        const tokenData = await apiService.getTokenInfo();
        console.log("Token info:", tokenData);
        
        setTokenInfo(tokenData ?? []);
      } catch (err) {
        console.error("Failed to load token info", err);
      }
    };

    fetchNotifications();
    fetchTokenInfo();
  }, []);

  return (
    <>
      <div className="notification-wrapper">
        <button
          className="notification-button"
          onClick={() => setIsDrawerOpen(true)}
        >
          🔔
          <span
            className="notification-badge"
            data-count={notifications.length}
          >
            {notifications.length}
          </span>
        </button>
      </div>

      <div
        className={`notification-drawer ${
          isDrawerOpen ? "open" : ""
        }`}
      >
        <div className="drawer-header">
          <h3>Notifications</h3>
          <button
            className="close-button"
            onClick={() => setIsDrawerOpen(false)}
          >
            ✖
          </button>
        </div>

        <div className="drawer-content">
          {(
            notifications.map((note) => (
              <div key={note.notificationId} className="notification-item">
                <strong>{note.type}</strong>
                <div>{note.message}</div>
                <small>
                  {new Date(note.createdAtUtc).toLocaleString()}
                </small>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        className={`drawer-overlay ${isDrawerOpen ? "show" : "" }`}
        onClick={() => setIsDrawerOpen(false)}
      />
    </>
  );
}

export default NotificationBell;