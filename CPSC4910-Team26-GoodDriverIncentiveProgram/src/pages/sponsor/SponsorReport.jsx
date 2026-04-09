import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/PageTitle";
import reportService, {
  buildOrderReportRequest,
  buildPointHistoryRequest,
  OrderSortBy,
  PointHistorySortBy,
  SortDirection,
} from "../../services/report";
import ReportViewer from "../../components/ReportViewer";
import PovBanner from "../../components/POVBanner";

function SponsorReport() {
  const navigate = useNavigate();

  const [reportType, setReportType] = useState("order");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔽 Filters
  const [driverId, setDriverId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [sponsorId, setSponsorId] = useState("");
  const [ebayItemId, setEbayItemId] = useState("");
  const [reasonLike, setReasonLike] = useState("");
  const [afterDate, setAfterDate] = useState("");
  const [beforeDate, setBeforeDate] = useState("");

  const runReport = async () => {
    try {
      setLoading(true);
      setError("");
      setReport(null);

      let result;

      if (reportType === "order") {
        result = await reportService.getOrderReport(
          buildOrderReportRequest({
            driverId: driverId ? Number(driverId) : null,
            organizationId: orgId ? Number(orgId) : null,
            ebayItemId: ebayItemId ? ebayItemId : null,
            afterUtcDate: afterDate || null,
            beforeUtcDate: beforeDate || null,
            sortOptions: [
              {
                field: OrderSortBy.CreatedAtUtc,
                direction: SortDirection.Desc,
              },
            ],
          }),
        );
      } else {
        result = await reportService.getPointHistoryReport(
          buildPointHistoryRequest({
            driverId: driverId ? Number(driverId) : null,
            sponsorId: sponsorId ? Number(sponsorId) : null,
            orgId: orgId ? Number(orgId) : null,
            reasonLike: reasonLike || null,
            afterUtcDate: afterDate || null,
            beforeUtcDate: beforeDate || null,
            sortOptions: [
              {
                field: PointHistorySortBy.CreatedAtUtc,
                direction: SortDirection.Desc,
              },
            ],
          }),
        );
      }

      setReport(result);
    } catch (err) {
      console.error("Report error:", err);
      setError(err.message || "Failed to run report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <PovBanner />
      <PageTitle title="Sponsor Reports | Team 26" />

      {/* Header */}
      <header className="catalog-header">
        <button onClick={() => navigate("/SponsorDashboard")}>Back</button>
      </header>

      {/* Title */}
      <div className="profile-header">
        <h1>Reports</h1>
        <div className="user-badge">Sponsor</div>
      </div>

      {/* Controls */}
      <div className="profile-card">
        <h2 style={{ marginBottom: "1rem" }}>Run Report</h2>

        {/* Report Type */}
        <div style={{ marginBottom: "1rem" }}>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="order">Order Report</option>
            <option value="point">Point History Report</option>
          </select>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
            marginBottom: "1rem",
          }}
        >
          <input
            placeholder="Driver ID"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
          />

          <input
            placeholder="Organization ID"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
          />

          {reportType === "point" && (
            <input
              placeholder="Sponsor ID"
              value={sponsorId}
              onChange={(e) => setSponsorId(e.target.value)}
            />
          )}

          {reportType === "order" && (
            <input
              placeholder="Ebay Item ID"
              value={ebayItemId}
              onChange={(e) => setEbayItemId(e.target.value)}
            />
          )}

          {reportType === "point" && (
            <input
              placeholder="Reason contains..."
              value={reasonLike}
              onChange={(e) => setReasonLike(e.target.value)}
            />
          )}

          <input
            type="date"
            value={afterDate}
            onChange={(e) => setAfterDate(e.target.value)}
          />

          <input
            type="date"
            value={beforeDate}
            onChange={(e) => setBeforeDate(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={runReport}>
          Run Report
        </button>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">✕</span>
            {error}
          </div>
        )}
      </div>

      {/* Report Output */}
      <ReportViewer report={report} loading={loading} error={error} />
    </div>
  );
}

export default SponsorReport;
