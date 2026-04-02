namespace Class4910Api.Models.Reports;

public class OrderReportRequest
{
    public int? OrganizationId { get; set; }
    public int? DriverId { get; set; }
    public int? EbayItemId { get; init; }

    public DateTime? BeforeUtcDate { get; init; }
    public DateTime? AfterUtcDate { get; init; }

    public IEnumerable<OrderReportSortOption> SortOptions { get; init; } = [];

    public override string ToString()
    {
        string sortOptionsStr = SortOptions != null
        ? string.Join(", ", SortOptions.Select(s => s.ToString()))
        : "null";

        return $"OrderReportRequest[" +
               $"OrganizationId: {OrganizationId?.ToString() ?? "null"}, " +
               $"DriverId: {DriverId?.ToString() ?? "null"}, " +
               $"EbayItemId: {EbayItemId?.ToString() ?? "null"}, " +
               $"BeforeUtcDate: {BeforeUtcDate?.ToString("o") ?? "null"}, " +
               $"AfterUtcDate: {AfterUtcDate?.ToString("o") ?? "null"}, " +
               $"SortOptions: [{sortOptionsStr}]" +
               $"]";
    }
}

public class OrderReportSortOption
{
    public OrderReportSortBy Field { get; init; }
    public SortDirection Direction { get; init; }
}

public enum OrderReportSortBy
{
    OrderId,
    DriverId,
    OrgId,
    CreatedAtUtc,
    EbayItemId
}