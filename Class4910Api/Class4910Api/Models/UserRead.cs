namespace Class4910Api.Models;

public class UserRead
{
    public required int Id { get; init; }
    public required string Username { get; init; }
    public required string? Email { get; init; }
    public required DateTime CreatedAtUtc { get; init; }

    public required UserRole Role { get; set; }
}
