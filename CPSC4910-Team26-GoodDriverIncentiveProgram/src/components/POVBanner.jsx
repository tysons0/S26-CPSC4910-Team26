import { useNavigate } from "react-router-dom";
import { useImpersonation } from "../hooks/useImpersonation";

function PovBanner() {
  const navigate = useNavigate();
  const { exitImpersonation, isImpersonating } = useImpersonation();

  if (isImpersonating()) {
    const impersonatorRole = sessionStorage.getItem("impersonator_role");
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    const handleExit = () => {
      const returnPath = exitImpersonation();
      navigate(returnPath);
    };

    return (
      <div className="pov-banner pov-banner--impersonation">
        <span>
          🔐 <strong>Impersonating:</strong> {currentUser.username} (
          {currentUser.role}) — logged in as {impersonatorRole}
        </span>
        <button className="pov-exit-btn" onClick={handleExit}>
          ✕ Exit Impersonation
        </button>
      </div>
    );
  }

  const povRole = sessionStorage.getItem("adminPovRole");
  const povSource = sessionStorage.getItem("povSource"); // "admin" or "sponsor"

  if (!povRole) return null;

  const handleExit = () => {
    sessionStorage.removeItem("adminPovRole");
    sessionStorage.removeItem("povSource");
    navigate(povSource === "sponsor" ? "/SponsorDashboard" : "/AdminDashboard");
  };

  return (
    <div className="pov-banner">
      <span>
        👁{" "}
        <strong>
          {povSource === "sponsor" ? "Sponsor POV:" : "Admin POV:"}
        </strong>{" "}
        Viewing as {povRole}
      </span>
      <button className="pov-exit-btn" onClick={handleExit}>
        ✕ Exit POV
      </button>
    </div>
  );
}

export default PovBanner;
