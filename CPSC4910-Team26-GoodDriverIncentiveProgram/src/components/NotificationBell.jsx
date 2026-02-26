import { useState } from "react";
import "../css/NavBar.css"; // or create NotificationBell.css if you prefer

function NotificationBell() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    "New message received",
    "Server restarted successfully",
    "New user registered"
  ]);

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

      {/* Drawer */}
      <div className={`notification-drawer ${isDrawerOpen ? "open" : ""}`}>
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
          {notifications.length === 0 ? (
            <div className="notification-item">
              No notifications
            </div>
          ) : (
            notifications.map((note, index) => (
              <div key={index} className="notification-item">
                {note}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`drawer-overlay ${
          isDrawerOpen ? "show" : ""
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />
    </>
  );
}

export default NotificationBell;