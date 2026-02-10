using Class4910Api.Models;

namespace Class4910Api.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResult> LoginAsync(UserRequest request, RequestData loginData);

    Task<Admin?> RegisterAdminUser(UserRequest request, RequestData registerData, int? creatorUserId = null);

    Task<Driver?> RegisterDriverUser(UserRequest request, RequestData registerData, int? creatorUserId = null);

    Task<Sponsor?> RegisterSponsorUser(UserRequest request, int orgId, int creatorUserId, RequestData registerData);

    Task<UserRead?> GetUserFromRequest(HttpContext requestContext);
}
