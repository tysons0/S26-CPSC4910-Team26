import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/AdminDashboard.css";

function AdminViewOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("orgId-asc");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const userRole = apiService.getUserRole();
        if (userRole?.toLowerCase() !== "admin") {
          navigate("/About");
          return;
        }

        const data = await apiService.getOrganizations();
        setOrganizations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setError(err.message || "Failed to load organizations");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const filteredAndSorted = [...organizations]
    .filter(
      (org) =>
        org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "orgId-asc":
          return (a.orgId || 0) - (b.orgId || 0);
        case "orgId-desc":
          return (b.orgId || 0) - (a.orgId || 0);
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "points-asc":
          return (a.pointWorth || 0) - (b.pointWorth || 0);
        case "points-desc":
          return (b.pointWorth || 0) - (a.pointWorth || 0);
        case "date-asc":
          return new Date(a.createdAtUtc) - new Date(b.createdAtUtc);
        case "date-desc":
          return new Date(b.createdAtUtc) - new Date(a.createdAtUtc);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="View Organizations | Admin" />
        <h1>Loading organizations...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="View Organizations | Admin" />
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "2rem",
        background: "var(--bg)",
        minHeight: "100vh",
        color: "var(--text-muted)",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <PageTitle title="View Organizations | Admin" />

      <header className="catalog-header">
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="submit"
            onClick={() => navigate("/AdminDashboard")}
          >
            Back
          </button>
        </div>
      </header>

      <h1 style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
        Organizations
      </h1>

      {/* Controls row */}
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search organizations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "0.6rem 0.75rem",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            outline: "none",
            minWidth: "220px",
          }}
        />

        <label style={{ fontWeight: 600, color: "var(--text-muted)" }}>
          Sort by:
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="view-select"
          style={{ width: "auto" }}
        >
          <option value="orgId-asc">Org ID ↑</option>
          <option value="orgId-desc">Org ID ↓</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="points-asc">Point Worth ↑</option>
          <option value="points-desc">Point Worth ↓</option>
          <option value="date-asc">Oldest First</option>
          <option value="date-desc">Newest First</option>
        </select>

        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.85rem",
            color: "var(--text-alt)",
          }}
        >
          {filteredAndSorted.length} organization
          {filteredAndSorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filteredAndSorted.length === 0 ? (
        <p style={{ color: "var(--text-alt)" }}>
          {searchQuery
            ? "No organizations match your search."
            : "No organizations found."}
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1rem",
          }}
        >
          {filteredAndSorted.map((org) => (
            <div
              key={org.orgId}
              style={{
                background: "var(--surface-alt)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "1.5rem",
                transition: "border-color 0.15s",
                cursor: "default",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#667eea")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            >
              {/* Header row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background:
                      "linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    flexShrink: 0,
                  }}
                >
                  🏢
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-alt)",
                    background: "var(--border)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "999px",
                    fontWeight: 600,
                  }}
                >
                  ID #{org.orgId}
                </span>
              </div>

              {/* Org name */}
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  marginBottom: "0.4rem",
                }}
              >
                {org.name || "Unnamed Organization"}
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-alt)",
                  marginBottom: "1rem",
                  minHeight: "1.2rem",
                }}
              >
                {org.description || "No description provided."}
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-alt)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "0.2rem",
                    }}
                  >
                    Point Worth
                  </div>
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#667eea",
                    }}
                  >
                    ${org.pointWorth ?? 1}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-alt)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "0.2rem",
                    }}
                  >
                    Created
                  </div>
                  <div
                    style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                  >
                    {org.createdAtUtc
                      ? new Date(org.createdAtUtc).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminViewOrganizations;
