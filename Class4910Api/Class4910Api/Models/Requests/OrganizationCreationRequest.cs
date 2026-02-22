namespace Class4910Api.Models.Requests;

public class OrganizationCreationRequest
{
    public required string Name { get; init; }
    public string? Description { get; init; } = null;
}
