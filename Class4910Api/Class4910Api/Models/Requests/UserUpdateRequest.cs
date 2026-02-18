namespace Class4910Api.Models.Requests;

public class UserUpdateRequest
{
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? Email { get; init; }
    public string? PhoneNumber { get; init; }
    public string? TimeZone { get; init; }
    public string? Country { get; init; }
}
