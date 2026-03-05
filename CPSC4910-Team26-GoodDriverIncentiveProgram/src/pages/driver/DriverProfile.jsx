import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/Profile.css";

function DriverProfile() {
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

  //Address States
  const [addresses, setAddresses] = useState([]);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    addressAllias: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    primary: false,
  });

  //Password States
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

          //fetch address
          try {
            const userAddresses = await apiService.getDriverAddresses(
              userData.id,
            );
            setAddresses(userAddresses || []);
          } catch (addressError) {
            console.error("Error fetching addresses:", addressError);
            // Don't show error to user, just leave addresses empty
          }
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
      console.error("Error updating profile", error);
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

  //Address Handlers
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const newAddress = await apiService.addDriverAddress(
        user.id,
        addressFormData,
      );
      setAddresses((prev) => [...prev, newAddress]);
      setAddingAddress(false);
      setAddressFormData({
        addressAlias: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        zipCode: "",
        primary: false,
      });
      setSuccessMessage("Address added successfully!");
    } catch (error) {
      console.error("Error adding address:", error);
      setError(error.message || "Failed to add address");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAddress = () => {
    setAddingAddress(false);
    setAddressFormData({
      addressAlias: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      primary: false,
    });
  };

  //Password Handlers
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
      await apiService.changeDriverPassword(
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

      {/* Address Management Card */}
      <div className="profile-card" style={{ marginTop: "2rem" }}>
        <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>
          Addresses
        </h2>

        {addresses.length === 0 ? (
          <p style={{ color: "#666", marginBottom: "1rem" }}>
            No addresses added yet.
          </p>
        ) : (
          <div style={{ marginBottom: "1.5rem" }}>
            {addresses.map((address, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  borderLeft: address.primary ? "4px solid #667eea" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                  }}
                >
                  <div>
                    <strong>{address.addressAlias}</strong>
                    {address.primary && (
                      <span
                        style={{
                          marginLeft: "0.5rem",
                          padding: "0.25rem 0.5rem",
                          backgroundColor: "#667eea",
                          color: "white",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                        }}
                      >
                        Primary
                      </span>
                    )}
                    <div style={{ marginTop: "0.5rem", color: "#666" }}>
                      <div>{address.addressLine1}</div>
                      {address.addressLine2 && (
                        <div>{address.addressLine2}</div>
                      )}
                      <div>
                        {address.city}, {address.state} {address.zipCode}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!addingAddress ? (
          <button
            className="btn btn-secondary"
            onClick={() => setAddingAddress(true)}
          >
            Add New Address
          </button>
        ) : (
          <form onSubmit={handleAddressSubmit} className="profile-form">
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Address Alias (e.g., Home, Work)</label>
                <input
                  type="text"
                  name="addressAlias"
                  value={addressFormData.addressAlias}
                  onChange={handleAddressChange}
                  className="form-input"
                  placeholder="Home"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Address Line 1</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={addressFormData.addressLine1}
                  onChange={handleAddressChange}
                  className="form-input"
                  placeholder="123 Main St"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Address Line 2 (Optional)</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={addressFormData.addressLine2}
                  onChange={handleAddressChange}
                  className="form-input"
                  placeholder="Apt 4B"
                />
              </div>

              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={addressFormData.city}
                  onChange={handleAddressChange}
                  className="form-input"
                  placeholder="New York"
                  required
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={addressFormData.state}
                  onChange={handleAddressChange}
                  className="form-input"
                  placeholder="NY"
                  required
                  maxLength={2}
                />
              </div>

              <div className="form-group">
                <label>ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={addressFormData.zipCode}
                  onChange={handleAddressChange}
                  className="form-input"
                  placeholder="10001"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    name="primary"
                    checked={addressFormData.primary}
                    onChange={handleAddressChange}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Set as primary address
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Adding..." : "Add Address"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelAddress}
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
export default DriverProfile;
