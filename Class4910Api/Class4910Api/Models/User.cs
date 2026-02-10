using MySql.Data.MySqlClient;

namespace Class4910Api.Models;

public class User
{
    public required int Id { get; init; }
    public required string Username { get; init; }
    public required string? Email { get; init; }
    public required string PasswordHash { get; init; }
    public required DateTime CreatedAtUtc { get; init; }

    public required UserRole Role { get; set; }

    public override string ToString()
    {
        return $"User: [Id: {Id}, Role: {Role}, Username: {Username}, Email: {Email ?? ""}, CreatedAtUtc: {CreatedAtUtc}]";
    }
    public UserRead ToReadFormat() 
    { 
        return new UserRead
        {
            Id = Id,
            Username = Username,
            Email = Email,
            CreatedAtUtc = CreatedAtUtc,
            Role = Role.ToString()
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