using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration.UserSecrets;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;
using static Class4910Api.ConstantValues;

namespace Class4910Api.Controllers;


[ApiController]
[Route("[controller]")]
public class OrganizationController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly IAuthService _authService;
    private readonly IContextService _contextService;
    private readonly IOrganizationService _organizationService;

    public OrganizationController(ILogger<AuthController> logger, IContextService contextService,
        IAuthService authService, IOrganizationService organizationService)
    {
        _logger = logger;
        _authService = authService;
        _contextService = contextService;
        _organizationService = organizationService;
    }

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<List<Organization>>> GetOrganizations()
    {
        List<Organization>? organizations = await _organizationService.GetOrganizations();

        return Ok(organizations ?? []);
    }
}

