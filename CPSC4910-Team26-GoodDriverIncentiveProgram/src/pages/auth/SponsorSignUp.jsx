import { Link, useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import { useState, useEffect } from "react";
import apiService from "../../services/api";
import "../../css/SignUp.css";
import { USERNAME_REGEX, USERNAME_REGEX_ERROR } from "../../services/regex";

function SponsorSignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    orgId: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      alert(
        "You must be logged in as an admin or sponsor to register sponsors",
      );
      navigate("/Login");
      return;
    }

    const userRole = apiService.getUserRole();
    const allowedRoles = ["admin", "sponsor"];

    if (!allowedRoles.includes(userRole?.toLowerCase())) {
      alert("Only admins and sponsors can register new sponsors");
      navigate("/Dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.userName.trim()) {
      newErrors.userName = "Username is required";
    } else if (!USERNAME_REGEX.test(formData.userName)) {
      newErrors.userName = USERNAME_REGEX_ERROR;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.orgId) {
      newErrors.orgId = "Orginization is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      const orgId = parseInt(formData.orgId);

      const response = await apiService.registerSponsor(
        {
          userName: formData.userName,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        },
        orgId,
      );

      console.log("Registration successful:", response);
      alert("Sponsor successfully registered!");

      const userRole = apiService.getUserRole();
      if (userRole?.toLowerCase() === "admin") {
        navigate("/AdminDashboard");
      } else if (userRole?.toLowerCase() === "sponsor") {
        navigate("/SponsorDashboard");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({
        submit: error.message || "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBackLink = () => {
    const userRole = apiService.getUserRole();
    if (userRole?.toLowerCase() === "admin") {
      return "/AdminDashboard";
    } else if (userRole?.toLowerCase() === "sponsor") {
      return "/SponsorDashboard";
    }
    return "/";
  };

  return (
    <div className="signup-container">
      <PageTitle title="Sponsor Signup" />
      <div className="signup-card">
        <h1 className="signup-title">Register a Sponsor!</h1>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="Your First Name"
                value={formData.firstName}
                onChange={handleChange}
                className={errors.firstName ? "error" : ""}
              />
              {errors.firstName && (
                <span className="error-message">{errors.firstName}</span>
              )}
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Your Last Name"
                value={formData.lastName}
                onChange={handleChange}
                className={errors.lastName ? "error" : ""}
              />
              {errors.lastName && (
                <span className="error-message">{errors.lastName}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="userName"
              placeholder="Enter user name"
              value={formData.userName}
              onChange={handleChange}
              className={errors.userName ? "error" : ""}
            />
            {errors.userName && (
              <span className="error-message">{errors.userName}</span>
            )}
          </div>

          <div className="form-group">
            <label>
              Email <span className="optional">(Optional)</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="your email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "error" : ""}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? "error" : ""}
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label>Organization ID</label>
            <input
              type="number"
              name="orgId"
              placeholder="Enter Organization ID"
              value={formData.orgId}
              onChange={handleChange}
              className={errors.orgId ? "error" : ""}
            />
            {errors.orgId && (
              <span className="error-message">{errors.orgId}</span>
            )}
          </div>

          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Registering..." : "Register Sponsor"}
          </button>

          <p className="login-link">
            <Link to={getBackLink()}>Back to Dashboard</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SponsorSignUp;
