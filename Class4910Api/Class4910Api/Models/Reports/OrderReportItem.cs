namespace Class4910Api.Models.Reports;

public class OrderReportItem
{
    public required int OrderId { get; init; }
    public required Organization Organization { get; init; }
    public required Driver Driver { get; init; }
    public required DriverAddress? DriverAddress { get; init; }
    public required int PointsSpent { get; init; }
    public required DateTime OrderDate { get; init; }
    public required EbayProduct? Product { get; init; }
}
