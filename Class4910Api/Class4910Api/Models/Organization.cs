namespace Class4910Api.Models;

public class Organization
{
    public required int OrgId { get; init; }
    public required string Name { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public required double PointWorth { get; init; }
}
