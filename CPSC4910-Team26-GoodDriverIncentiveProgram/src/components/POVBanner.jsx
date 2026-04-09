import { useNavigate } from "react-router-dom";

function PovBanner() {
  const navigate = useNavigate();
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
