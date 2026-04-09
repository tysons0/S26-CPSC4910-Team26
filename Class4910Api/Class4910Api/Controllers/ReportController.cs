using Class4910Api.Models;
using Class4910Api.Models.Reports;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using static Class4910Api.ConstantValues;

namespace Class4910Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class ReportController : ControllerBase
{
    private readonly ILogger<ReportController> _logger;
    private readonly IReportService _reportService;
    private readonly IAuthService _authService;
    private readonly IContextService _contextService;
    private readonly IUserService _userService;
    private readonly ISponsorService _sponsorService;
    private readonly IDriverService _driverService;

    public ReportController(ILogger<ReportController> logger, 
                            IReportService reportService,
                            IAuthService authService,
                            IUserService userService,
                            ISponsorService sponsorService,
                            IDriverService driverService,
                            IContextService contextService)
    {
        _logger = logger;
        _reportService = reportService;
        _authService = authService;
        _contextService = contextService;
        _userService = userService;
        _sponsorService = sponsorService;
        _driverService = driverService;
    }

    [Authorize]
    [HttpPost("point-history")]
    public async Task<ActionResult<ReportTable>> GetPointHistoryReport([FromBody] PointHistoryReportRequest reportRequest)
    {
        int userId = _contextService.GetUserId(HttpContext);
        User? user = await _userService.FindUserById(userId);
        if (user is null)
            return NotFound("User not found");

        _logger.LogInformation("User {UserId} requested point history report with parameters: {ReportRequest}",
            userId, reportRequest);

        if (user.Role == UserRole.Sponsor)
        {
            Sponsor? sponsor = await _sponsorService.GetSponsorByUserId(userId);
            if (sponsor is null)
            {
                _logger.LogWarning("Unauthorized access attempt by user {UserId} for point history report", userId);
                return Forbid();
            }
            reportRequest.OrgId = sponsor.OrganizationId;
        }
        if (user.Role == UserRole.Driver)
        {
            Driver? driver = await _driverService.GetDriverByUserId(userId);
            if (driver is null)
            {
                _logger.LogWarning("Unauthorized access attempt by user {UserId} for point history report", userId);
                return Forbid();
            }
            reportRequest.DriverId = driver.DriverId;
        }

        ReportTable? reportTable = await _reportService.GetPointHistoryReport(reportRequest);
        return Ok(reportTable);
    }

    [Authorize]
    [HttpPost("order")]
    public async Task<ActionResult<ReportTable>> GetOrderReport([FromBody] OrderReportRequest reportRequest)
    {
        int userId = _contextService.GetUserId(HttpContext);
        User? user = await _userService.FindUserById(userId);
        if (user is null)
            return NotFound("User not found");

        _logger.LogInformation("User {UserId} requested order report with parameters: {ReportRequest}",
            userId, reportRequest);

        if (user.Role == UserRole.Sponsor)
        {
            Sponsor? sponsor = await _sponsorService.GetSponsorByUserId(userId);
            if (sponsor is null)
            {
                _logger.LogWarning("Unauthorized access attempt by user {UserId} for order report", userId);
                return Forbid();
            }
            reportRequest.OrganizationId = sponsor.OrganizationId;
        }
        if (user.Role == UserRole.Driver)
        {
            Driver? driver = await _driverService.GetDriverByUserId(userId);
            if (driver is null)
            {
                _logger.LogWarning("Unauthorized access attempt by user {UserId} for order report", userId);
                return Forbid();
            }
            reportRequest.DriverId = driver.DriverId;
        }

        ReportTable? reportTable = await _reportService.GetOrderReport(reportRequest);
        return Ok(reportTable);
    }

    [Authorize]
    [HttpPost("audit-log")]
    public async Task<ActionResult<ReportTable>> GetAuditLogReport([FromBody] AuditLogReportRequest reportRequest)
    {


        return Ok();
    }
}
