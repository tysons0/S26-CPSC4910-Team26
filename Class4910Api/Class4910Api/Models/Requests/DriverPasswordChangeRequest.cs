namespace Class4910Api.Models.Requests;

public class DriverPasswordChangeRequest
{
    public required string CurrentPassword { get; init; }
    public required string NewPassword { get; init; }
}
