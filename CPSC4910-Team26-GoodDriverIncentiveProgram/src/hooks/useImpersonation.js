import { useNavigate } from "react-router-dom";
import apiService from "../services/api";

export function useImpersonation() {
  const navigate = useNavigate();

  const impersonate = async ({ userId, username, role, targetPath }) => {
    try {
      // Save the real admin/sponsor session before overwriting it
      const realToken = apiService.getToken();
      const realUser = JSON.parse(localStorage.getItem("user") || "{}");

      sessionStorage.setItem("impersonator_token", realToken);
      sessionStorage.setItem("impersonator_user", JSON.stringify(realUser));
      sessionStorage.setItem("impersonator_role", realUser.role || "admin");
      sessionStorage.setItem(
        "impersonator_return_path",
        role === "driver" ? "/AdminViewDrivers" : "/AdminViewSponsors",
      );

      // Call the login-as endpoint
      const data = await apiService.impersonateUser(userId);

      // Swap in the impersonated user's token + info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userRole", data.user.role);

      window.dispatchEvent(new Event("authChange"));
      navigate(targetPath);
    } catch (err) {
      console.error("Impersonation failed:", err);
      alert("Failed to impersonate user: " + (err.message || "Unknown error"));
    }
  };

  const exitImpersonation = () => {
    const realToken = sessionStorage.getItem("impersonator_token");
    const realUser = sessionStorage.getItem("impersonator_user");
    const returnPath =
      sessionStorage.getItem("impersonator_return_path") || "/AdminDashboard";

    if (realToken) localStorage.setItem("token", realToken);
    if (realUser) {
      const parsed = JSON.parse(realUser);
      localStorage.setItem("user", JSON.stringify(parsed));
      localStorage.setItem("userRole", parsed.role || "admin");
    }

    sessionStorage.removeItem("impersonator_token");
    sessionStorage.removeItem("impersonator_user");
    sessionStorage.removeItem("impersonator_role");
    sessionStorage.removeItem("impersonator_return_path");

    return returnPath;
  };

  const isImpersonating = () => !!sessionStorage.getItem("impersonator_token");

  return { impersonate, exitImpersonation, isImpersonating };
}
