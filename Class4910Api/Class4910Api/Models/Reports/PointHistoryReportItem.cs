namespace Class4910Api.Models.Reports;

public class PointHistoryReportItem
{
    public required Driver Driver { get; init; }
    public required Sponsor? Sponsor { get; init; }
    public required int PointChange { get; init; }
    public required string Reason { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
}