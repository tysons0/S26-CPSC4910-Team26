namespace Class4910Api.Models;

public class User
{
    public required int Id { get; init; }
    public required string Username { get; init; }

    public required string? FirstName { get; init; }
    public required string? LastName { get; init; }
    public required string? Email { get; init; }
    public required string PasswordHash { get; init; }
    public required DateTime CreatedAtUtc { get; init; }

    public required string? PhoneNumber { get; init; }
    public required string? TimeZone { get; init; }
    public required string? Country { get; init; }

    public required DateTime? LastLoginUtc { get; init; }

    public required UserRole Role { get; set; }

    public override string ToString()
    {
        return this.ToReadFormat().ToString() ?? "";
    }

    public UserRead ToReadFormat()
    {
        return new UserRead
        {
            Id = Id,
            Username = Username,
            FirstName = FirstName,
            LastName = LastName,
            Email = Email,
            CreatedAtUtc = CreatedAtUtc,
            Role = Role.ToString(),

            PhoneNumber = PhoneNumber,
            TimeZone = TimeZone,
            Country = Country,
            LastLoginUtc = LastLoginUtc
        };
    }
}

public enum UserRole
{
    User,
    Driver,
    Sponsor,
    Admin
}