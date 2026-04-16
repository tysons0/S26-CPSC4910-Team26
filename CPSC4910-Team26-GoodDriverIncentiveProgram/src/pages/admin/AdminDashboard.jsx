import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import ProductCard from "../../components/Product";
import apiService from "../../services/api";
import "../../css/AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //user info
  const [drivers, setDrivers] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [applications, setApplications] = useState([]);

  const [povRole, setPovRole] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    if (value) {
      navigate(value);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRole = apiService.getUserRole();
        if (userRole?.toLowerCase() !== "admin") {
          navigate("/About");
          return;
        }
        const userData = await apiService.getUserInfo();
        if (userData) {
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }

        const drivers = await apiService.getDrivers();
        setDrivers(drivers);

        const sponsors = await apiService.getSponsors();
        setSponsors(sponsors);

        const admins = await apiService.getAdmins();
        setAdmins(admins);

        const orgs = await apiService.getOrganizations();
        setOrgs(orgs);

        const apps = await apiService.getApplications();
        setApplications(apps);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const pendingApplications = applications.filter((app) => {
    const status = app.status?.toLowerCase();
    return (
      status === "pending" || status === "waiting" || status === "submitted"
    );
  });

  const handlePovChange = (e) => {
    const role = e.target.value;
    if (role) {
      sessionStorage.setItem("adminPovRole", role);
      navigate(role === "driver" ? "/DriverDashboard" : "/SponsorDashboard");
    }
  };

  const handleUploadUsers = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadResult("");

    try {
      await apiService.uploadUsers(file);
      setUploadResult("Users uploaded successfully!");
    } catch (error) {
      setUploadResult("Upload failed: " + (error.message || "Unknown error"));
    } finally {
      setUploading(false);
      e.target.value = ""; // reset file input
    }
  };

  return (
    <div className="admin-shell">
      <PageTitle title="Admin Dashboard" />

      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-dot">A</div>
          <span className="brand-name">AdminDashboard</span>
        </div>

        <span className="nav-section-label">Users</span>
        <Link to="/AdminViewDrivers" className="nav-item">
          🚗 Drivers
        </Link>
        <Link to="/AdminViewSponsors" className="nav-item">
          🧑‍💼 Sponsors
        </Link>
        <Link to="/AdminViewAdmins" className="nav-item">
          🛡 Admins
        </Link>

        <span className="nav-section-label">Manage</span>
        <Link to="/AdminApplications" className="nav-item">
          📋 Applications
        </Link>
        <Link to="/CreateOrganization" className="nav-item">
          🏢 Organizations
        </Link>
        <Link to="/AdminReport" className="nav-item">
          📊 Reports
        </Link>

        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="avatar">
              {user?.username?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <div className="user-name">{user?.username || "Admin"}</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="topbar-title">
              Welcome back, {user?.username || "Admin"} 👋
            </div>
            <div className="topbar-sub">
              Manage users and organizations here.
            </div>
          </div>

          <select
            className="view-select pov-switch-select"
            onChange={handlePovChange}
            value=""
          >
            <option value="" disabled>
              👁 Switch POV…
            </option>
            <option value="driver">🚗 View as Driver</option>
            <option value="sponsor">🧑‍💼 View as Sponsor</option>
          </select>
        </header>
        {/* Content */}
        <main className="admin-content">
          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Total Drivers</div>
              <div className="stat-value">{drivers.length}</div>
              <Link to="/AdminViewDrivers" className="stat-sub">
                View all →
              </Link>
            </div>
            <div className="stat-card">
              <div className="stat-label">Sponsors</div>
              <div className="stat-value">{sponsors.length}</div>
              <Link to="/AdminViewSponsors" className="stat-sub">
                View all →
              </Link>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending Apps</div>
              <div className="stat-value">{pendingApplications.length}</div>
              <Link to="/AdminApplications" className="stat-sub">
                Needs Review →
              </Link>
            </div>
            <div className="stat-card">
              <div className="stat-label">Organizations</div>
              <div className="stat-value">{orgs.length}</div>
              <Link to="/Organizations" className="stat-sub">
                All Active →
              </Link>
            </div>
          </div>

          {/* Actions + Right column */}
          <div className="admin-grid-2">
            {/* Quick Actions */}
            <div className="section-card">
              <div className="section-title">Quick Actions</div>
              <div className="action-list">
                {[
                  {
                    to: "/AdminApplications",
                    icon: "📋",
                    label: "Manage Applications",
                    bg: "rgba(102,126,234,0.15)",
                  },
                  {
                    to: "/DriverSignUp",
                    icon: "🚗",
                    label: "Register Driver",
                    bg: "rgba(72,187,120,0.15)",
                  },
                  {
                    to: "/SponsorSignUp",
                    icon: "🧑‍💼",
                    label: "Register Sponsor",
                    bg: "rgba(237,137,54,0.15)",
                  },
                  {
                    to: "/AdminSignUp",
                    icon: "🛡",
                    label: "Register Admin",
                    bg: "rgba(237,100,166,0.15)",
                  },
                  {
                    to: "/CreateOrganization",
                    icon: "🏢",
                    label: "Create Organization",
                    bg: "rgba(118,75,162,0.15)",
                  },
                  {
                    icon: "📤",
                    label: "Upload Users",
                    bg: "rgba(102,126,234,0.15)",
                    isUpload: true,
                  },
                ].map(({ to, icon, label, bg, isUpload }) =>
                  isUpload ? (
                    <div
                      key="upload"
                      className="action-row"
                      onClick={() =>
                        document.getElementById("admin-upload-input").click()
                      }
                      style={{
                        cursor: uploading ? "not-allowed" : "pointer",
                        opacity: uploading ? 0.6 : 1,
                      }}
                    >
                      <div className="action-row-left">
                        <div className="action-icon" style={{ background: bg }}>
                          {icon}
                        </div>
                        {label}
                      </div>
                      <span style={{ color: "var(--text-alt)" }}>›</span>
                    </div>
                  ) : (
                    <Link key={to} to={to} className="action-row">
                      <div className="action-row-left">
                        <div className="action-icon" style={{ background: bg }}>
                          {icon}
                        </div>
                        {label}
                      </div>
                      <span style={{ color: "var(--text-alt)" }}>›</span>
                    </Link>
                  ),
                )}
              </div>

              <input
                id="admin-upload-input"
                type="file"
                accept=".txt,.csv,.psv"
                style={{ display: "none" }}
                onChange={handleUploadUsers}
              />

              {uploadResult && (
                <p
                  style={{
                    marginTop: "0.75rem",
                    fontSize: "0.85rem",
                    color: uploadResult.startsWith("Upload failed")
                      ? "#fc8181"
                      : "#68d391",
                  }}
                >
                  {uploadResult}
                </p>
              )}
            </div>

            {/* View Users + Activity */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div className="section-card">
                <div className="section-title">View Users By Type</div>
                <select
                  className="view-select"
                  onChange={handleChange}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select user type…
                  </option>
                  <option value="/AdminViewDrivers">Drivers</option>
                  <option value="/AdminViewSponsors">Sponsors</option>
                  <option value="/AdminViewAdmins">Admins</option>
                </select>
              </div>

              <div className="section-card" style={{ flex: 1 }}>
                <div className="section-title">Recent Activity</div>
                <div className="feed">
                  <div className="feed-item">
                    <div className="feed-dot" />
                    <div>
                      <div className="feed-text">
                        Platform loaded successfully
                      </div>
                      <div className="feed-time">Just now</div>
                    </div>
                  </div>
                  {/* Wire real activity from your API here */}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
