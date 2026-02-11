namespace Class4910Api.Models;

public class Sponsor
{
    public required int SponsorId { get; init; }
    public required int OrganizationId { get; init; }
    public required UserRead UserData { get; init; }

    public override string ToString()
    {
        return $"Sponsor[SponsorId: {SponsorId}, OrganizationId: {OrganizationId}, {UserData}]";
    }
}
