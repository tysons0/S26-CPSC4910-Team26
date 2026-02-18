using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Class4910Api.Controllers;

[Authorize]
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

    [HttpGet]
    public async Task<ActionResult<List<Organization>>> GetOrganizations()
    {
        List<Organization>? organizations = await _organizationService.GetOrganizations();

        return Ok(organizations ?? []);
    }
}

