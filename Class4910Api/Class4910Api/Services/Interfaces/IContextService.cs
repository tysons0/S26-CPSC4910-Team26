using Class4910Api.Models;
using Class4910Api.Models.Requests;

namespace Class4910Api.Services.Interfaces;

public interface IContextService
{
    RequestData? GetRequestData(HttpContext context);

    int GetUserId(HttpContext context);
    UserRole GetUserRole(HttpContext context);

    Task<UserRead?> GetUserFromRequest(HttpContext requestContext);

    TokenInfo? GetTokenInfoFromRequest(HttpContext requestContext);
}
