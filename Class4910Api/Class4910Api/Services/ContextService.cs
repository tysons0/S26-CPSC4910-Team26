using System.Net;
using System.Security.Claims;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Org.BouncyCastle.Asn1.Ocsp;

namespace Class4910Api.Services;

public class ContextService : IContextService
{
    private readonly ILogger<ContextService> _logger;
    private readonly IUserService _userService;
    public ContextService(ILogger<ContextService> logger, IUserService userService)
    {
        _logger = logger;
        _userService = userService;
    }

    public int GetUserId(HttpContext context)
    {
        string? id = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        bool retrieved = int.TryParse(id, out var userId);
        if (retrieved)
        {
            return userId;
        }
        throw new InvalidOperationException("User ID not found in context.");
    }

    public UserRole GetUserRole(HttpContext context)
    {
        string role = context.User.FindFirst(ClaimTypes.Role)?.Value 
            ?? throw new("Role not found in context");

        bool parsed = Enum.TryParse<UserRole>(role, out var userRole);
        if (parsed == false)
        {
            throw new InvalidOperationException($"Invalid role value in context. [{role}]");
        }

        return userRole;
    }

    public RequestData? GetRequestData(HttpContext context)
    {
        foreach(var header in context.Request.Headers)
        {
            _logger.LogCritical("Header: {HeaderKey} = {HeaderValue}", header.Key, header.Value);
        }
        HttpRequest request = context.Request;

        IPAddress clientIp = GetClientIp(context);

        string userAgent =
            request.Headers.UserAgent.ToString() ?? "Unknown";

        return new RequestData
        {
            ClientIP = clientIp,
            UserAgent = userAgent
        };
    }

    private static IPAddress GetClientIp(HttpContext context)
    {
        // X-Forwarded-For may contain multiple IPs
        string? forwardedFor =
            context.Request.Headers["X-Forwarded-For"].FirstOrDefault();

        IPAddress? remoteIp = context.Connection.RemoteIpAddress;
        IPAddress? localIp = context.Connection.LocalIpAddress;


        if (!string.IsNullOrWhiteSpace(forwardedFor) && remoteIp?.Equals(IPAddress.Loopback) == false)
        {
            string firstIp = forwardedFor.Split(',')[0].Trim();
            if (IPAddress.TryParse(firstIp, out IPAddress? parsed))
                return parsed;
        }

        return remoteIp ?? localIp ?? IPAddress.None;
    }

    public async Task<UserRead?> GetUserFromRequest(HttpContext requestContext)
    {
        int userId = GetUserId(requestContext);

        User? user = await _userService.FindUserById(userId);

        if (user is null)
        {
            _logger.LogError("Failed to retrieve user information for user id {UserId}", userId);
            return null;
        }
        UserRead userRead = user.ToReadFormat();

        _logger.LogInformation("Retrieved user information from request: {UserData}", userRead);
        return userRead;
    }

}
