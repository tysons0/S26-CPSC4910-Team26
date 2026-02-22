namespace Class4910Api.Models;

public class Organization
{
    public required int OrgId { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public required double PointWorth { get; init; }

    public override string ToString()
    {
        return $"Organization[OrgId: {OrgId}, Name: {Name}, Description: {Description ?? ""}, CreatedAtUtc: {CreatedAtUtc.ToShortDateString()}, PointWorth: {PointWorth}]";
    }
}
