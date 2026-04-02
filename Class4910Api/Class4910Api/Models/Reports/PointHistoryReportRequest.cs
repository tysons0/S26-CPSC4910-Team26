namespace Class4910Api.Models.Reports;

public class PointHistoryReportRequest
{
    public int? DriverId { get; set; }
    public int? SponsorId { get; init; }
    public int? OrgId { get; set; }
    public string? ReasonLike { get; init; }

    public DateTime? BeforeUtcDate { get; init; }
    public DateTime? AfterUtcDate { get; init; }

    public IEnumerable<PointHistorySortOption> SortOptions { get; init; } = [];

    public override string ToString()
    {
        string sortOptionsStr = SortOptions != null
        ? string.Join(", ", SortOptions.Select(s => s.ToString()))
        : "null";

        return $"PointHistoryReportRequest[" +
               $"DriverId: {DriverId?.ToString() ?? "null"}, " +
               $"SponsorId: {SponsorId?.ToString() ?? "null"}, " +
               $"OrgId: {OrgId?.ToString() ?? "null"}, " +
               $"ReasonLike: {ReasonLike ?? "null"}, " +
               $"BeforeUtcDate: {BeforeUtcDate?.ToString("o") ?? "null"}, " +
               $"AfterUtcDate: {AfterUtcDate?.ToString("o") ?? "null"}, " +
               $"SortOptions: [{sortOptionsStr}]" +
               $"]";
    }
}


public class PointHistorySortOption
{
    public PointHistorySortBy Field { get; init; }
    public SortDirection Direction { get; init; }
}

public enum PointHistorySortBy
{
    CreatedAtUtc,
    DriverId,
    SponsorId,
    OrganizationId,
    PointDelta
}