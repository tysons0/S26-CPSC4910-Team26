using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static Class4910Api.ConstantValues;

namespace Class4910Api.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly IAuthService _authService;
    private readonly IContextService _contextService;
    private readonly IUserService _userService;
    private readonly IOrganizationService _organizationService;

    public AuthController(ILogger<AuthController> logger, IUserService userService, IOrganizationService organizationService,
                          IAuthService authService, IContextService contextService)
    {
        _logger = logger;
        _authService = authService;
        _contextService = contextService;
        _userService = userService;
        _organizationService = organizationService;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserRead>> GetCurrentUser()
    {
        UserRead? userData = await _contextService.GetUserFromRequest(HttpContext);

        if (userData is null)
        {
            string error = $"Failed to retrieve user information from request";
            _logger.LogError("{Error}", error);
            return BadRequest(error);
        }

        return userData;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResult>> Login([FromBody] UserRequest loginRequest)
    {
        RequestData? requestData = _contextService.GetRequestData(HttpContext);

        if (requestData is null)
        {
            string error = $"Could not retrieve Request Data for login attempt on {loginRequest.UserName}";
            _logger.LogWarning("{Error}", error);
            return BadRequest(error);
        }

        LoginResult loginResult = await _authService.LoginAsync(loginRequest, requestData);

        if (loginResult.Error is not null)
        {
            _logger.LogInformation("Login Failed for {User}. {Error}", loginRequest.UserName, loginResult.Error);
            return BadRequest(loginResult.Error);
        }

        return loginResult;
    }

    [Authorize]
    [HttpPost("password-change")]
    public async Task<ActionResult> ChangePassword([FromBody] PasswordChangeRequest changeRequest)
    {
        _logger.LogInformation("Password change attempt for user {User}", changeRequest.UserName);

        RequestData? requestData = _contextService.GetRequestData(HttpContext);

        if (requestData is null)
        {
            string error = $"Could not retrieve Request Data for password change attempt on {changeRequest.UserName}";
            _logger.LogWarning("{Error}", error);
            return BadRequest(error);
        }

        UserRequest userRequest = new()
        {
            UserName = changeRequest.UserName,
            Password = changeRequest.CurrentPassword
        };

        LoginResult loginResult = await _authService.LoginAsync(userRequest, requestData);

        if (loginResult.Error is not null || !loginResult.Token.StartsWith("ey") )
        {
            return BadRequest("Current password is incorrect.");
        }

        bool changeResult = await _authService.UpdateUserPassword(changeRequest);

        _logger.LogInformation("Password change {Result} for user {User}", changeResult ? "succeeded" : "failed", changeRequest.UserName);
        return Ok(changeResult);
    }

    [Authorize(Roles = ADMIN)]
    [HttpPost("register/admin")]
    public async Task<ActionResult<Admin>> RegisterAdmin([FromBody] UserRequest request)
    {
        RequestData? requestData = _contextService.GetRequestData(HttpContext);

        if (requestData is null)
        {
            string error = $"Could not retrieve Request Data for admin creation on {request.UserName}";
            _logger.LogWarning("{Error}", error);
            return BadRequest(error);
        }

        User? existingUser = await _userService.FindUserByName(request.UserName);

        if (existingUser is not null)
        {
            string error = $"A user with the username {request.UserName} already exists";
            _logger.LogWarning("{Error}", error);
            return BadRequest(error);
        }

        Admin? admin = await _authService.RegisterAdminUser(request, requestData);

        if (admin is null)
        {
            string error = $"Failed to create admin {request.UserName}";
            _logger.LogError("{Error}", error);
            return BadRequest(error);
        }

        return Created(string.Empty, admin);
    }

    [HttpPost("register/driver")]
    public async Task<ActionResult<Driver>> RegisterDriver([FromBody] UserRequest request)
    {
        RequestData? requestData = _contextService.GetRequestData(HttpContext);
        if (requestData is null)
        {
            string error = $"Could not retrieve Request Data for driver creation on {request.UserName}";
            _logger.LogWarning("{Error}", error);
            return BadRequest(error);
        }

        User? existingUser = await _userService.FindUserByName(request.UserName);

        if (existingUser is not null)
        {
            string error = $"A user with the username {request.UserName} already exists";
            _logger.LogWarning("{Error}", error);
            return BadRequest(error);
        }

        Driver? user = await _authService.RegisterDriverUser(request, requestData);

        if (user is null)
        {
            string error = $"Failed to create driver {request.UserName}";
            _logger.LogError("{Error}", error);
            return BadRequest(error);
        }

        return Created(string.Empty, user);
    }

    [Authorize(Roles = $"{ADMIN},{SPONSOR}")]
    [HttpPost("register/sponsor")]
    public async Task<ActionResult<Sponsor>> RegisterSponsor([FromBody] UserRequest request, [FromQuery] int orgId)
    {
        RequestData? requestData = _contextService.GetRequestData(HttpContext);
        int creatorId = _contextService.GetUserId(HttpContext);
        UserRole role = _contextService.GetUserRole(HttpContext);

        bool orgEditAccess = await _authService.UserHasAccessToEditOrg(creatorId, role, orgId);

        if (orgEditAccess == false)
        {
            string error = $"User {creatorId} does not have permission to create sponsors for org {orgId}";
            _logger.LogWarning("{Error}", error);
            return Forbid();
        }

        Organization? org = await _organizationService.GetOrganizationById(orgId);

        if (org is null)
        {
            string error = $"Organization[{orgId}] does not exist.";
            _logger.LogInformation("{Error}", error);
            return BadRequest(error);
        }

        User? existingUser = await _userService.FindUserByName(request.UserName);

        if (existingUser is not null)
        {
            string error = $"A user with the username {request.UserName} already exists";
            _logger.LogWarning("{Error}", error);
            return BadRequest(error);
        }

        if (requestData is null)
        {
            string error = $"Could not retrieve Request Data for sponsor creation on {request.UserName}";
            _logger.LogWarning("{Error}", error);
            return BadRequest(error);
        }

        Sponsor? user = await _authService.RegisterSponsorUser(request, orgId, creatorId, requestData);

        if (user is null)
        {
            string error = $"Failed to create sponsor {request.UserName}";
            _logger.LogError("{Error}", error);
            return BadRequest(error);
        }

        return Created(string.Empty, user);
    }
}
