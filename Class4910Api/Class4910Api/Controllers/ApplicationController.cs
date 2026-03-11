using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using static Class4910Api.ConstantValues;

namespace Class4910Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class ApplicationController : ControllerBase
{
    private readonly ILogger<ApplicationController> _logger;
    private readonly IDriverService _driverService;
    private readonly ISponsorService _sponsorService;
    private readonly IOrganizationService _organizationService;
    private readonly IUserService _userService;
    private readonly IApplicationService _applicationService;
    private readonly IAuthService _authService;
    private readonly IContextService _contextService;

    public ApplicationController(ILogger<ApplicationController> logger,
        IDriverService driverService, ISponsorService sponsorService, IOrganizationService organizationService,
        IUserService userService, IApplicationService applicationService,
        IContextService contextService, IAuthService authService)
    {
        _logger = logger;
        _driverService = driverService;
        _sponsorService = sponsorService;
        _organizationService = organizationService;
        _userService = userService;
        _applicationService = applicationService;
        _authService = authService;
        _contextService = contextService;
    }

    [Authorize(Roles = $"{ADMIN},{SPONSOR}")]
    [HttpPost("{applicationId:int}/status")]
    public async Task<ActionResult> ChangeApplicationStatus(int applicationId, [FromQuery] string newStatus,
                                                            [FromQuery] string changeReason)
    {
        int userId = _contextService.GetUserId(HttpContext);

        bool updateResult =
            await _applicationService.UpdateApplicationStatus(applicationId: applicationId,
                                                              newStatus: newStatus,
                                                              reason: changeReason,
                                                              editorUserId: userId);
        if (updateResult)
        {
            return Ok($"Updated Application[{applicationId}] to status[{newStatus}]");
        }
        else
        {
            return BadRequest();
        }
    }

    [Authorize(Roles = DRIVER)]
    [HttpPost("{orgId:int}/apply")]
    public async Task<ActionResult> CreateApplication(int orgId, [FromBody] string message)
    {
        int userId = _contextService.GetUserId(HttpContext);
        Driver? driver = await _driverService.GetDriverByUserId(userId);
        if (driver == null)
        {
            return BadRequest("Could not identify driver from request");
        }

        bool creationResult = await _applicationService.CreateApplication(driver.DriverId, orgId, message);

        if (creationResult)
        {
            return Ok($"Created application for Organization[{orgId}]");
        }
        else
        {
            return BadRequest("Failed to create application for Organization[{orgId}]");
        }
    }

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<List<DriverApplication>>> GetApplications(int? orgId = null)
    {
        int userId = _contextService.GetUserId(HttpContext);

        User? user = await _userService.FindUserById(userId);
        if (user is null)
        {
            return BadRequest("Could not find user from context");
        }

        List<DriverApplication>? applications;

        if (orgId is not null)
        {
            OrgAccess orgAccess = await _authService.RetrieveUserOrgAccess(user.Id, orgId);
            if (orgAccess is OrgAccess.NoAccess)
            {
                return Unauthorized($"{user.GetDescribers()} does not have access to Organization[{orgId}]");
            }
            applications = await _applicationService.GetDriverApplicationsByOrg(orgId.Value);
        }
        else if (user.Role is UserRole.Driver)
        {
            Driver? driver = await _driverService.GetDriverByUserId(userId);
            if (driver == null)
            {
                return BadRequest($"Could not identify driver from request {user.GetDescribers()}");
            }
            applications = await _applicationService.GetDriverApplicationsByDriver(driver.DriverId);
        }
        else if (user.Role is UserRole.Sponsor)
        {
            Sponsor? sponsor = await _sponsorService.GetSponsorByUserId(userId);
            if (sponsor == null)
            {
                return BadRequest($"Could not identify sponsor from request {user.GetDescribers()}");
            }
            applications = await _applicationService.GetDriverApplicationsByOrg(sponsor.OrganizationId);
        }
        else if (user.Role is UserRole.Admin)
        {
            applications = await _applicationService.GetAllDriverApplications();
        }
        else
        {
            return BadRequest($"Could not identify what applications to serve {user.GetDescribers()}");
        }

        if (applications is null)
        {
            return StatusCode(500, $"Issue retrieving applications for {user.GetDescribers()}.");
        }

        return Ok(applications);
    }

    [Authorize(Roles = DRIVER)]
    [HttpDelete("{applicationId:int}")]
    public async Task<ActionResult> WithdrawDriverApplication(int applicationId)
    {
        int userId = _contextService.GetUserId(HttpContext);

        Driver? driver = await _driverService.GetDriverByUserId(userId);
        DriverApplication? application = await _applicationService.GetApplication(applicationId);

        if (driver is null || application is null || application.DriverId != driver.DriverId)
        {
            return BadRequest();
        }

        bool deleteResult = await _applicationService.DeleteApplication(applicationId);

        if (deleteResult)
        {
            return Ok($"Deleted Application[{applicationId}]");
        }
        else
        {
            return StatusCode(500, $"Failed to delete application[{applicationId}]");
        }
    }
}
