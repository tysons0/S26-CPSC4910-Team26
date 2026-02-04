using System.Net;
using System.Security.Claims;
using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Class4910Api.Services;

public class ContextService : IContextService
{
    public int GetUserId(HttpContext context)
    {
        var id = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        bool retrieved = int.TryParse(id, out var userId);
        if (retrieved)
        {
            return userId;
        }
        throw new InvalidOperationException("User ID not found in context.");
    }

    public string GetUserRole(HttpContext context)
    {
        return context.User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
    }

    public RequestData? GetRequestData(HttpContext context)
    {
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

        if (!string.IsNullOrWhiteSpace(forwardedFor))
        {
            string firstIp = forwardedFor.Split(',')[0].Trim();
            if (IPAddress.TryParse(firstIp, out IPAddress? parsed))
                return parsed;
        }

        // Cloudflare
        string? cfConnectingIp =
            context.Request.Headers["CF-Connecting-IP"].FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(cfConnectingIp) &&
            IPAddress.TryParse(cfConnectingIp, out IPAddress? cfIp))
        {
            return cfIp;
        }

        return context.Connection.RemoteIpAddress ?? IPAddress.None;
    }


}
