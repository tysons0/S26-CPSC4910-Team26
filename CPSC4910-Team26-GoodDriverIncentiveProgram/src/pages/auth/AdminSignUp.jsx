import { Link, useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import { useState, useEffect } from "react";
import apiService from "../../services/api";
import "../../css/SignUp.css";
import { USERNAME_REGEX, USERNAME_REGEX_ERROR } from "../../services/regex";

function AdminSignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      alert("You must be logged in as an admin to register admins");
      navigate("/Login");
      return;
    }

    const userRole = apiService.getUserRole();
    const allowedRoles = ["admin"];

    if (!allowedRoles.includes(userRole?.toLowerCase())) {
      alert("Only admins can register new admins");
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
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
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
      const response = await apiService.registerAdmin({
        userName: formData.userName,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });
      console.log("Registration successful:", response);
      alert("Admin successfully registered! ");
      navigate("/AdminDashboard");
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({
        submit: error.message || "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <PageTitle title="Admin Signup" />

      <div className="signup-card">
        <h1 className="signup-title">Register an Admin!</h1>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="Admin's First Name"
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
                placeholder="Admin's Last Name"
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
              placeholder="Enter Admin's User Name"
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

          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>

          <p className="login-link">
            <Link to="/AdminDashboard">Back to Admin Dashboard</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default AdminSignUp;
