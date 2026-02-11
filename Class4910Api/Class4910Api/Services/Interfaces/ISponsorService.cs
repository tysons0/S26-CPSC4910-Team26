using Class4910Api.Models;

namespace Class4910Api.Services.Interfaces;

public interface ISponsorService
{
    Task<Sponsor?> GetSponsorBySponsorId(int sponsorId);
    Task<Sponsor?> GetSponsorByUserId(int userId);

    Task<Sponsor?> GetSponsorByName(string userName);
}
