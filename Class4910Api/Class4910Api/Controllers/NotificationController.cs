using Class4910Api.Models;
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
    private readonly IUserService _userService;
    private readonly IContextService _contextService;
    private readonly INotificationService _notificationService;
    private readonly IAuthService _authService;

    public NotificationController(ILogger<NotificationController> logger,
        IContextService contextService, IUserService userService,
        INotificationService notificationService, IAuthService authService)
    {
        _logger = logger;
        _contextService = contextService;
        _notificationService = notificationService;
        _authService = authService;
        _userService = userService;
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
        else if (userRole != UserRole.Admin)
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

    [HttpPatch]
    public async Task<ActionResult> MarkNotificationAsSeen([FromQuery] int notificationId)
    {
        int userId = _contextService.GetUserId(HttpContext);
        User? user = await _userService.FindUserById(userId);

        if (user is null)
        {
            return BadRequest("Could not identify user from request");
        }

        List<Notification>? userNotifications =
            await _notificationService.GetNotificationsForUser(userId);

        if (userNotifications is null)
        {
            return StatusCode(500, "Could not find notifications for user.");
        }

        if (userNotifications.Any(n => n.NotificationId == notificationId))
        {
            await _notificationService.MarkNotificationAsSeen(notificationId);
            return Ok($"Marked notification[{notificationId}] as seen");
        }
        else
        {
            return BadRequest($"[{User}] does not have notification[{notificationId}]");
        }
    }
}
