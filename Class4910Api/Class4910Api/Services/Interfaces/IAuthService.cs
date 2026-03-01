using Class4910Api.Models;
using Class4910Api.Models.Requests;

namespace Class4910Api.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResult> LoginAsync(UserRequest request, RequestData loginData);

    Task<Admin?> RegisterAdminUser(UserRequest request, RequestData registerData, int? creatorUserId = null);

    Task<Driver?> RegisterDriverUser(UserRequest request, RequestData registerData, int? creatorUserId = null);

    Task<Sponsor?> RegisterSponsorUser(UserRequest request, int orgId, int creatorUserId, RequestData registerData);

    Task<bool> UserHasAccessToEditOrg(int userId, UserRole role, int orgId);

    Task<bool> UserCanSeeUser(int viewerUser, int userBeingViewed);
  
    Task<bool> UpdateUserPassword(string password, string? userName = null, int? userId = null);
}
