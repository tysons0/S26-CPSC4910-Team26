import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import PageTitle from "../../components/PageTitle";
import apiService from "../../services/api";
import "../../css/SignUp.css";
import { ORGANIZATION_NAME_REGEX, ORGANIZATION_NAME_REGEX_ERROR } from "../../services/regex";

function OrganizationCreate() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    orgName: "",
    description: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      alert("You must be logged in as an admin to create organizations.");
      navigate("/Login");
      return;
    }

    const userRole = apiService.getUserRole();

    if (!userRole || userRole.toLowerCase() !== "admin") {
      alert("Only admins can create organizations.");
      navigate("/Dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.orgName.trim()) {
      newErrors.orgName = "Organization name is required.";
    } else if (!ORGANIZATION_NAME_REGEX.test(formData.orgName)) {
      newErrors.orgName = ORGANIZATION_NAME_REGEX_ERROR;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await apiService.createOrganization({
        name: formData.orgName.trim(),
        description: formData.description.trim(),
      });

      alert("Organization successfully created!");
      navigate("/AdminDashboard");
    } catch (error) {
      console.error("Create Organization Error:", error);
      setErrors({
        submit: error.message || "Failed to create organization.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <PageTitle title="Create Organization" />

      <div className="signup-card">
        <h1 className="signup-title">Create Organization</h1>

        <form className="signup-form" onSubmit={handleSubmit}>
          {/* Organization Name */}
          <div className="form-group">
            <label>Organization Name</label>
            <input
              type="text"
              name="orgName"
              placeholder="Enter organization name"
              value={formData.orgName}
              onChange={handleChange}
              className={errors.orgName ? "error" : ""}
            />
            {errors.orgName && (
              <span className="error-message">{errors.orgName}</span>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label>
              Description <span className="optional">(Optional)</span>
            </label>
            <textarea
              name="description"
              placeholder="Enter organization description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Organization"}
          </button>

          <p className="login-link">
            <Link to="/AdminDashboard">Back to Admin Dashboard</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default OrganizationCreate;