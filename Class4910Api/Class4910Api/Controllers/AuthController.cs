using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration.UserSecrets;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;
using static Class4910Api.Configuration.ConstantValues;

namespace Class4910Api.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly IAuthService _authService;
    private readonly IContextService _contextService;

    public AuthController(ILogger<AuthController> logger, IAuthService authService, IContextService contextService)
    {
        _logger = logger;
        _authService = authService;
        _contextService = contextService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<string>> Login([FromBody] UserRequest loginRequest)
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

        return loginResult.Token;
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

        Admin? admin = await _authService.CreateAdminUser(request, requestData);

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

        Driver? user = await _authService.CreateDriverUser(request, requestData);

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
    public async Task<ActionResult<Driver>> RegisterSponsor([FromBody] UserRequest request, [FromQuery] int orgId)
    {
        RequestData? requestData = _contextService.GetRequestData(HttpContext);
        _contextService.GetUserId(HttpContext);

        if (requestData is null)
        {
            string error = $"Could not retrieve Request Data for driver creation on {request.UserName}";
            _logger.LogWarning("{Error}", error);
            return BadRequest(error);
        }

        Driver? user = await _authService.CreateDriverUser(request, requestData);

        if (user is null)
        {
            string error = $"Failed to create driver {request.UserName}";
            _logger.LogError("{Error}", error);
            return BadRequest(error);
        }

        return Created(string.Empty, user);
    }
}
