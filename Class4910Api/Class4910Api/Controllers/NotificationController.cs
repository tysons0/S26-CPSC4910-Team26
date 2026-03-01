using Class4910Api.Models;
using Class4910Api.Services;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Class4910Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class NotificationController : ControllerBase
{

    private readonly ILogger<NotificationController> _logger;
    private readonly IContextService _contextService;
    private readonly INotificationService _notificationService;
    private readonly IAuthService _authService;

    public NotificationController(ILogger<NotificationController> logger, IContextService contextService,
        INotificationService notificationService, IAuthService authService)
    {
        _logger = logger;
        _contextService = contextService;
        _notificationService = notificationService;
        _authService = authService;
    }

    [HttpGet("{userId:int}")]
    public async Task<ActionResult<List<Notification>>> GetNotifications(int userId)
    {
        UserRole userRole = _contextService.GetUserRole(HttpContext);
        int contextUserId = _contextService.GetUserId(HttpContext);

        if (contextUserId == userId)
        {
            _logger.LogWarning("User[{Id}] is retrieving notifications for themselves but not using right endpoint",
                userId);
        }
        else if (await _authService.UserCanSeeUser(contextUserId, userId) == false) 
        {
            _logger.LogWarning("User[{Id}] tried to view User[{Id}] notifications but was forbidden.", 
                contextUserId, userId);
            return Forbid();
        }

        List<Notification>? notifications = await _notificationService.GetNotificationsForUser(userId);


        return Ok(notifications ?? []);
    }

    [HttpGet("me")]
    public async Task<ActionResult<List<Notification>>> GetMyNotifications()
    {
        int contextUserId = _contextService.GetUserId(HttpContext);

        _logger.LogInformation("Retrieve notifications for ContextUser[{Id}]", contextUserId);

        List<Notification>? notifications = await _notificationService.GetNotificationsForUser(contextUserId);

        return Ok(notifications ?? []);
    }


}
