using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using static Class4910Api.ConstantValues;

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
    private readonly IUserService _userService;
    private readonly ISponsorService _sponsorService;
    private readonly IDriverService _driverService;

    public OrganizationController(ILogger<AuthController> logger, IContextService contextService,
        IAuthService authService, IOrganizationService organizationService,
        IUserService userService, ISponsorService sponsorService, IDriverService driverService)
    {
        _logger = logger;
        _authService = authService;
        _contextService = contextService;
        _organizationService = organizationService;
        _userService = userService;
        _sponsorService = sponsorService;
        _driverService = driverService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Organization>>> GetOrganizations()
    {
        List<Organization>? organizations = await _organizationService.GetOrganizations();

        return Ok(organizations ?? []);
    }

    [Authorize(Roles = ADMIN)]
    [HttpPost]
    public async Task<ActionResult<Organization>> CreateOrganization([FromBody] OrganizationCreationRequest request)
    {
        int userId = _contextService.GetUserId(HttpContext);
        Organization? organization = await _organizationService.GetOrganizationByName(request.Name);
        if (organization is not null)
            return BadRequest("Organization with the same name already exists");

        organization = await _organizationService.CreateOrganization(request, userId);

        if (organization is null)
            return BadRequest("Failed to create organization");

        return Ok(organization);
    }

    [Authorize(Roles = $"{ADMIN},{SPONSOR}")]
    public async Task<ActionResult<List<Driver>>> GetDriversFromOrganization([FromQuery] int? orgId = null)
    {
        int contextUserId = _contextService.GetUserId(HttpContext);
        User? user = await _userService.FindUserById(contextUserId);
        if (user is null)
        {
            return BadRequest();
        }

        int requestingOrgId;
        if ((orgId is null || orgId == 0) && user.Role == UserRole.Sponsor)
        {
            Sponsor? sponsor = await _sponsorService.GetSponsorByUserId(contextUserId);
            if (sponsor is null)
            {
                return BadRequest();
            }
            requestingOrgId = sponsor.OrganizationId;
        }
        else
        {
            return BadRequest();
        }

        if (requestingOrgId == 0)
        {
            return BadRequest();
        }

        List<Driver>? driverList = await _driverService.GetDriversByOrgId(requestingOrgId);

        if (driverList is null)
        {
            return BadRequest();
        }

        return Ok(driverList);
    }

}

