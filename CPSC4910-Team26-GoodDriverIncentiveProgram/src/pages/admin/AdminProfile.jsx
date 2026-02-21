import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/Profile.css";

function AdminProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    timeZone: "",
    country: "",
  });
  const navigate = useNavigate();

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
          setFormData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || "",
            phoneNumber: userData.phoneNumber || "",
            timeZone: userData.timeZone || "",
            country: userData.country || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const updatedUser = await apiService.updateUserProfile(user.id, formData);
      setUser(updatedUser);
      setEditing(false);
      setSuccessMessage("Profile Updated Successfully!");

      const refreshedData = await apiService.getUserInfo();
      if (refreshedData) {
        setUser(refreshedData);
        localStorage.setItem("user", JSON.stringify(refreshedData));
      }
    } catch (error) {
      console.error("Error update profile", error);
      setError(
        error.message || "Failed to update user profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    // Reset form data to current user data
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      timeZone: user?.timeZone || "",
      country: user?.country || "",
    });
    setEditing(false);
    setError("");
    setSuccessMessage("");
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    //Validation
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError("All password fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    setSaving(true);

    try {
      await apiService.changePassword(
        user.username,
        passwordData.currentPassword,
        passwordData.newPassword,
      );

      setPasswordSuccess("Successfully changed password!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        setChangingPassword(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError(
        error.message ||
          "Failed to change password. Please check your current password",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setChangingPassword(false);
    setPasswordError("");
    setPasswordSuccess("");
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageTitle title="Driver Profile | Team 26" />
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <PageTitle title="Driver Profile | Team 26" />

      <div className="profile-header">
        <h1>{user?.username}'s Profile</h1>
        <div className="user-badge">{user?.role}</div>
      </div>

      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">✕</span>
          {error}
        </div>
      )}

      {/* Profile Information Card */}
      <div className="profile-card">
        <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>
          Profile Information
        </h2>
        {!editing ? (
          <>
            <div className="profile-grid">
              <div className="profile-item">
                <label>Username</label>
                <div className="profile-value">{user?.username}</div>
              </div>

              <div className="profile-item">
                <label>User ID</label>
                <div className="profile-value">#{user?.id}</div>
              </div>

              <div className="profile-item">
                <label>First Name</label>
                <div className="profile-value">
                  {user?.firstName || <span className="not-set">Not set</span>}
                </div>
              </div>

              <div className="profile-item">
                <label>Last Name</label>
                <div className="profile-value">
                  {user?.lastName || <span className="not-set">Not set</span>}
                </div>
              </div>

              <div className="profile-item">
                <label>Email</label>
                <div className="profile-value">
                  {user?.email || <span className="not-set">Not set</span>}
                </div>
              </div>

              <div className="profile-item">
                <label>Phone Number</label>
                <div className="profile-value">
                  {user?.phoneNumber || (
                    <span className="not-set">Not set</span>
                  )}
                </div>
              </div>

              <div className="profile-item">
                <label>Time Zone</label>
                <div className="profile-value">
                  {user?.timeZone || <span className="not-set">Not set</span>}
                </div>
              </div>

              <div className="profile-item">
                <label>Country</label>
                <div className="profile-value">
                  {user?.country || <span className="not-set">Not set</span>}
                </div>
              </div>

              <div className="profile-item">
                <label>Member Since</label>
                <div className="profile-value">
                  {new Date(user?.createdAtUtc).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              <div className="profile-item">
                <label>Last Login</label>
                <div className="profile-value">
                  {user?.lastLoginUtc ? (
                    new Date(user.lastLoginUtc).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  ) : (
                    <span className="not-set">Never</span>
                  )}
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter first name"
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter last name"
                />
              </div>

              <div className="form-group full-width">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="email@example.com"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label>Time Zone</label>
                <input
                  type="text"
                  name="timeZone"
                  value={formData.timeZone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="America/New_York"
                />
              </div>

              <div className="form-group full-width">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="United States"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Password Change Card */}
      <div className="profile-card" style={{ marginTop: "2rem" }}>
        <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>
          Security
        </h2>

        {passwordSuccess && (
          <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
            <span className="alert-icon">✓</span>
            {passwordSuccess}
          </div>
        )}

        {passwordError && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
            <span className="alert-icon">✕</span>
            {passwordError}
          </div>
        )}

        {!changingPassword ? (
          <button
            className="btn btn-secondary"
            onClick={() => setChangingPassword(true)}
          >
            Change Password
          </button>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="profile-form">
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="form-input"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="form-input"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="form-input"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Changing..." : "Change Password"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelPasswordChange}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminProfile;
