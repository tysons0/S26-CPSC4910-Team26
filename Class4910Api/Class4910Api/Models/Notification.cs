namespace Class4910Api.Models;

public class Notification
{
    public required int NotificationId { get; init; }
    public required int UserId { get; init; }

    public required string Message { get; init; }
    public required string Type { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
}
