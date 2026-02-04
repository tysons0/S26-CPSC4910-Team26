using Class4910Api.Models;

namespace Class4910Api.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResult> LoginAsync(UserRequest request, RequestData loginData);

    Task<Admin?> CreateAdminUser(UserRequest request, RequestData registerData, int? creatorUserId = null);

    Task<Driver?> CreateDriverUser(UserRequest request, RequestData registerData, int? creatorUserId = null);

    Task<Sponsor?> CreateSponsorUser(UserRequest request, int orgId, int creatorUserId, RequestData registerData);
}
