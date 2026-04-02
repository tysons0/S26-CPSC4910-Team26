namespace Class4910Api.Models;

public class PointHistoryRecord
{
    public required int DriverId { get; init; }
    public required int? SponsorId { get; init; }
    public required int PointChange { get; init; }
    public required string Reason { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
}
