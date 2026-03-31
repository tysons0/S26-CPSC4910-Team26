namespace Class4910Api.Models.Reports;

public class PointHistoryReportRequest
{
    public int? DriverId { get; init; }
    public int? SponsorId { get; init; }
    public string? ReasonLike { get; init; }

    public DateTime? BeforeUtcDate { get; init; }
    public DateTime? AfterUtcDate { get; init; }
}
