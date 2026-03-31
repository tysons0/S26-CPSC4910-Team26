using Class4910Api.Models.Reports;
using Newtonsoft.Json;

namespace Class4910Api.Services.Interfaces;

public interface IReportService
{
    Task<List<OrderReportItem>> GetOrderReport(OrderReportRequest request);
}
