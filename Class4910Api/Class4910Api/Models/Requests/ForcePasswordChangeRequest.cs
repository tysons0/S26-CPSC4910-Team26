namespace Class4910Api.Models.Requests;

public class ForcePasswordChangeRequest
{
    public required int UserId { get; init; }
    public required string NewPassword { get; init; }
}
