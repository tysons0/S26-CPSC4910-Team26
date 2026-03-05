namespace Class4910Api.Models;

public class DriverApplication
{
    public required int ApplicationId { get; init; }
    public required int DriverId { get; init; }
    public required int OrgId { get; init; }

    public int? SponsorId { get; init; } = null;

    public required string Status { get; init; }

    public required string DriverMessage { get; init; }
    public string? ChangeReason { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public required DateTime LastModifiedUtc { get; init; }
}
