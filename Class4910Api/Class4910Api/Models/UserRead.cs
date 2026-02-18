namespace Class4910Api.Models;

using static FormatHelper;

public class UserRead
{
    public required int Id { get; init; }
    public required string Username { get; init; }

    public required string? FirstName { get; init; }
    public required string? LastName { get; init; }

    public required string? Email { get; init; }
    public required DateTime CreatedAtUtc { get; init; }

    public required string? PhoneNumber { get; init; }
    public required string? TimeZone { get; init; }
    public required string? Country { get; init; }

    public required DateTime? LastLoginUtc { get; init; }

    public required string Role { get; set; }

    public override string ToString()
    {

        return
            $"User[Id: {Id}, Username: {Username}, FirstName: {FormatNullable(FirstName)}, " +
            $"LastName: {FormatNullable(LastName)}, Email: {FormatNullable(Email)}, " +
            $"PhoneNumber: {FormatNullable(PhoneNumber)}, TimeZone: {FormatNullable(TimeZone)}, " +
            $"Country: {FormatNullable(Country)}, Role: {Role}, " +
            $"CreatedAtUtc: {FormatDate(CreatedAtUtc)}, " +
            $"LastLoginUtc: {FormatDate(LastLoginUtc)}]";
    }
}

