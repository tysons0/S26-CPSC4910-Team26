using Class4910Api.Models.Reports;
using Newtonsoft.Json;

namespace Class4910Api.Services.Interfaces;

public interface IReportService
{
    Task<ReportTable?> GetOrderReport(OrderReportRequest request);

    Task<ReportTable?> GetPointHistoryReport(PointHistoryReportRequest request);

    Task<ReportTable?> GetAuditLogReport(AuditLogReportRequest request);
}
