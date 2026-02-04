using Class4910Api.Models;

namespace Class4910Api.Services.Interfaces;

public interface IContextService
{
    RequestData? GetRequestData(HttpContext context);

    int GetUserId(HttpContext context);
    string GetUserRole(HttpContext context);
}
