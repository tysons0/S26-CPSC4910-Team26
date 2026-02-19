import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";

function AdminProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const naviagte = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!apiService.isAuthenticated()) {
          navigate("/Login");
          return;
        }

        const userData = await apiService.getUserInfo();
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [naviagte]);

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="Admin Profile | Team 26" />
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <PageTitle title="Admin Profile | Team 26" />
      <h1>{user?.username}'s Profile</h1>

      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "2rem",
          borderRadius: "8px",
          maxWidth: "600px",
          margin: "2rem 0",
        }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <strong>Username:</strong> {user?.username}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>User ID:</strong> {user?.id}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>Role:</strong> {user?.role}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>First Name:</strong> {user?.firstName || "Not set"}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>Last Name:</strong> {user?.lastName || "Not set"}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>Email:</strong> {user?.email || "Not set"}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>Phone Number:</strong> {user?.phoneNumber || "Not set"}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>Time Zone:</strong> {user?.timeZone || "Not set"}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>Country:</strong> {user?.country || "Not set"}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>Member Since:</strong>{" "}
          {new Date(user?.createdAtUtc).toLocaleDateString()}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <strong>Last Login:</strong>{" "}
          {user?.lastLoginUtc
            ? new Date(user.lastLoginUtc).toLocaleString()
            : "N/A"}
        </div>

        <button
          onClick={() => alert("Edit functionality coming soon!")}
          style={{ marginTop: "1rem", padding: "0.5rem 1.5rem" }}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}

export default AdminProfile;
