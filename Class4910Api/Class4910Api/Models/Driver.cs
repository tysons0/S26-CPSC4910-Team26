namespace Class4910Api.Models;

public class Driver
{
    public required int DriverId { get; init; }
    public int? OrganizationId { get; init; } = null;

    public List<DriverAddress> Addresses = [];

    public required UserRead UserData { get; init; }

    override public string ToString()
    {
        return $"Driver[DriverId: {DriverId}, Address Count: {Addresses.Count}, " +
               $"OrganizationId: {OrganizationId?.ToString() ?? "null"}, " +
               $"{UserData}]";
    }
}
