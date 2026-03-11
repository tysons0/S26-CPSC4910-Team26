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
    [HttpGet]
    public async Task<ActionResult<List<Driver>>> GetDriversFromOrganization([FromQuery] int orgId)
    {
        int contextUserId = _contextService.GetUserId(HttpContext);
        User? user = await _userService.FindUserById(contextUserId);
        if (user is null)
        {
            return BadRequest();
        }

        OrgAccess orgAccess = await _authService.RetrieveUserOrgAccess(user.Id, orgId);

        if (orgAccess is OrgAccess.NoAccess)
        {
            return Unauthorized();
        }

        if (orgId == default)
        {
            return BadRequest();
        }

        List<Driver>? driverList = await _driverService.GetDriversByOrgId(orgId);

        return Ok(driverList ?? []);
    }

    [Authorize(Roles = $"{ADMIN},{SPONSOR}, {DRIVER}")]
    [HttpGet("{orgId:int}")]
    public async Task<ActionResult<Organization>> GetOrganizationById(int orgId)
    {
        int userId = _contextService.GetUserId(HttpContext);
        UserRole role = _contextService.GetUserRole(HttpContext);

        if (role == UserRole.Sponsor)
        {
            Sponsor? sponsor = await _sponsorService.GetSponsorByUserId(userId);
            if (sponsor is null || sponsor.OrganizationId != orgId)
            {
                return BadRequest("You do not have access to this organization");
            }
        }
        else if (role == UserRole.Driver)
        {
            Driver? driver = await _driverService.GetDriverByUserId(userId);
            if (driver is null || driver.OrganizationId != orgId)
            {
                return BadRequest("You do not have access to this organization");
            }
        }

        Organization? organization = await _organizationService.GetOrganizationById(orgId);
        if (organization is null)
        {
            return NotFound("Organization not found");
        }

        return Ok(organization);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<Organization>> GetOrganizationContext()
    {
        int userId = _contextService.GetUserId(HttpContext);
        UserRole role = _contextService.GetUserRole(HttpContext);

        int? orgId = null;
        if (role == UserRole.Sponsor)
        {
            Sponsor? sponsor = await _sponsorService.GetSponsorByUserId(userId);
            orgId = sponsor?.OrganizationId;
        }
        else if (role == UserRole.Driver)
        {
            Driver? driver = await _driverService.GetDriverByUserId(userId);
            orgId = driver?.OrganizationId;
        }

        if (orgId is null)
        {
            return BadRequest($"Could not find Organization for {userId}-{role}");
        }

        Organization? organization = await _organizationService.GetOrganizationById((int)orgId);

        if (organization is null)
        {
            return NotFound($"Could not find Organization[{orgId}]");
        }
        return Ok(organization);
    }

}

