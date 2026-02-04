namespace Class4910Api.Models;

public class Driver
{
    public required int DriverId { get; init; }
    public int? OrganizationId { get; init; } = null;
    public required UserRead UserData { get; init; }
}
