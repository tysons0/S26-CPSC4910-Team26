namespace Class4910Api.Models;

public class UserRead
{
    public required int Id { get; init; }
    public required string Username { get; init; }
    public required string? Email { get; init; }
    public required DateTime CreatedAtUtc { get; init; }

    public required string Role { get; set; }

    public override string ToString()
    {
        return $"User[Id: {Id}, Role: {Role}, Username: {Username}, Email: {Email ?? "null"}, CreatedAtUtc: {CreatedAtUtc.ToShortDateString()}]";
    }
}
