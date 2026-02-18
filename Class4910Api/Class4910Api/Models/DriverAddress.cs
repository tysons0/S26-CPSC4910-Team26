namespace Class4910Api.Models;

public class DriverAddress
{
    public required int DriverId { get; init; }
    public required string City { get; init; }

    public required string ZipCode { get; init; }

    public required string State { get; init; }

    public required string AddressLine1 { get; init; }

    public required string AddressLine2 { get; init; }
    public required string AddressAlias { get; init; }
    public required bool Primary { get; init; }
}
