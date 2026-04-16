namespace Class4910Api.Models;

public class Driver
{
    public required int DriverId { get; init; }
    public required bool NotifyForPointsChanged { get; init; }

    public required List<DriverAddress> Addresses { get; init; }
    public required List<(Organization Org, int Points)> DriverOrgsAndPoints { get; init; }

    public required UserRead UserData { get; init; }

    public bool IsInOrg(int orgId) => DriverOrgsAndPoints.Any(o => o.Org.OrgId == orgId);
    override public string ToString()
    {
        return $"Driver[DriverId: {DriverId}, Address Count: {Addresses.Count}, " +
               $"NotifyForPointsChanged: {NotifyForPointsChanged}, " +
               $"{UserData}]";
    }
}
