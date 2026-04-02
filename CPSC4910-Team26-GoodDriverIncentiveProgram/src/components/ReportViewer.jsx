import "../css/ReportViewer.css";

const ReportViewer = ({ report, loading, error }) => {
  if (loading) return <div className="report-state">Loading report...</div>;
  if (error) return <div className="report-state error">Error: {error}</div>;

  if (!report || !report.headers || !report.rows) {
    return <div className="report-state">No data available</div>;
  }

  if (report.rows.length === 0) {
    return <div className="report-state">No results found</div>;
  }

  return (
    <div className="report-container">
      <div className="report-header">
        <h3>Report Results</h3>
        <button onClick={() => downloadCSV(report)}>Download CSV</button>
      </div>

      <div className="report-table-wrapper">
        <table className="report-table">
          <thead>
            <tr>
              {report.headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {report.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex}>{formatCell(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const formatCell = (value) => {
  if (value === null || value === undefined) return "N/A";

  if (typeof value === "string" && value.includes("T")) {
    const date = new Date(value);
    if (!isNaN(date)) return date.toLocaleString();
  }

  return value.toString();
};

const downloadCSV = (report) => {
  const csv =
    report.headers.join(",") +
    "\n" +
    report.rows.map((r) => r.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "report.csv";
  a.click();
};

export default ReportViewer;