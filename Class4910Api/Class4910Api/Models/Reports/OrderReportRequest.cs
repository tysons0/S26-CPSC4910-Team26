namespace Class4910Api.Models.Reports;

public class OrderReportRequest
{
    public int? OrganizationId { get; init; }
    public int? DriverId { get; init; }
    public int? EbayItemId { get; init; }

    public DateTime? BeforeUtcDate { get; init; }
    public DateTime? AfterUtcDate { get; init; }

}
