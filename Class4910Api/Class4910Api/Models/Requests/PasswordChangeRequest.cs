namespace Class4910Api.Models.Requests;

public class PasswordChangeRequest
{
    public required string UserName { get; init; }
    public required string CurrentPassword { get; init; }
    public required string NewPassword { get; init; }
}
