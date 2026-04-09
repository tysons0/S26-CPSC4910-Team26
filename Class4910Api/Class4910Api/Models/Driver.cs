namespace Class4910Api.Models;

public class Driver
{
    public required int DriverId { get; init; }
    public int? OrganizationId { get; init; } = null;
    public required int Points { get; init; }
    public required bool NotifyForPointsChanged { get; init; }

    public required List<DriverAddress> Addresses { get; init; }

    public required UserRead UserData { get; init; }

    override public string ToString()
    {
        return $"Driver[DriverId: {DriverId}, Points: {Points}, Address Count: {Addresses.Count}, " +
               $"NotifyForPointsChanged: {NotifyForPointsChanged}, " +
               $"OrganizationId: {OrganizationId?.ToString() ?? "null"}, " +
               $"{UserData}]";
    }
}
