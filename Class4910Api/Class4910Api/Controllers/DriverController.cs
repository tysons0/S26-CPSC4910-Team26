using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static Class4910Api.ConstantValues;


namespace Class4910Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class DriverController : ControllerBase
{

    private readonly ILogger<DriverController> _logger;
    private readonly IContextService _contextService;
    private readonly IDriverService _driverService;
    private readonly ISponsorService _sponsorService;
    private readonly IAuthService _authService;

    public DriverController(ILogger<DriverController> logger, IAuthService authService,
        IDriverService driverService, ISponsorService sponsorService, IContextService contextService)
    {
        _logger = logger;
        _contextService = contextService;
        _driverService = driverService;
        _sponsorService = sponsorService;
        _authService = authService;
    }

    [Authorize (Roles = $"{ADMIN},{SPONSOR}")]
    [HttpGet]
    public async Task<ActionResult<List<Driver>>> GetAllDrivers()
    {
        UserRead? user = await _contextService.GetUserFromRequest(HttpContext);
        if (user is null)
        {
            return BadRequest();
        }

        UserRole role = Enum.Parse<UserRole>(user.Role);

        if (role == UserRole.Sponsor)
        {
            Sponsor? sponsor = await _sponsorService.GetSponsorByUserId(user.Id);

            if (sponsor is null) 
            {

                return BadRequest();
            }

            List<Driver>? driverList = await _driverService.GetDriversByOrgId(sponsor.SponsorId);

            return Ok(driverList ?? []);
        }
        else if (role == UserRole.Admin)
        {
            List<Driver>? driverList = await _driverService.GetAllDrivers();

            return Ok(driverList ?? []);
        }
        else
        {
            return Unauthorized();
        }
    }

    [Authorize(Roles = DRIVER)]
    [HttpGet("me")]
    public async Task<ActionResult<Driver>> GetCurrentDriver()
    {
        int userId = _contextService.GetUserId(HttpContext);
        Driver? driver = await _driverService.GetDriverByUserId(userId);

        if (driver is null)
        {
            string err = $"Driver not found from context using userId[{userId}].";
            _logger.LogWarning("{Error}", err);
            return NotFound(err);
        }

        _logger.LogInformation("Got Current {Driver}", driver);

        return Ok(driver);
    }

    [HttpGet("{userId:int}")]
    public async Task<ActionResult<Driver>> GetDriver(int userId)
    {
        int contextUserId = _contextService.GetUserId(HttpContext);

        Driver? driver = await _driverService.GetDriverByUserId(userId);
        if (driver is null)
        {
            return NotFound($"No driver found with ID {userId}");
        }

        OrgAccess orgAccess = await _authService.RetrieveUserOrgAccess(contextUserId, driver.OrganizationId);

        if (driver.UserData.Id != contextUserId && orgAccess is not OrgAccess.ReadWrite)
        {
            return Forbid($"You do not have permission to access driver with ID {contextUserId}");
        }

        return Ok(driver);
    }

    [HttpGet("{driverId:int}/address")]
    public async Task<ActionResult<List<DriverAddress>>> GetDriverAddresses(int driverId)
    {
        List<DriverAddress>? addressList = await _driverService.GetDriverAddresses(driverId);

        if (addressList is null)
        {
            return BadRequest($"Confirm that driver[{driverId}] exists");
        }

        return Ok(addressList);

    }

    [HttpPost("{driverId:int}/address")]
    public async Task<ActionResult> AddDriverAddress(int driverId, [FromBody] AddressRequest addressRequest)
    {
        bool addResult = await _driverService.AddDriverAddress(driverId, addressRequest);

        if (addResult)
        {
            return Ok($"Added address for Driver[{driverId}].");
        }
        else
        {
            return BadRequest($"Confirm that driver[{driverId}] exists and AddressRequest[{addressRequest}] is valid.");
        }
    }

    [HttpPost("{driverId:int}/address/{addressId:int}")]
    public async Task<ActionResult> ChangePrimaryAddress(int driverId, int addressId)
    {
        bool changeResult = await _driverService.SetPrimaryAddress(driverId, addressId);

        if (changeResult)
        {
            return Ok($"Changed address[{addressId}] for Driver[{driverId}] to primary.");
        }
        else
        {
            return BadRequest($"Confirm that driver[{driverId}] and address {addressId} exist.");
        }
    }

    [HttpPut("{driverId:int}/address/{addressId:int}")]
    public async Task<ActionResult> UpdateAddress(int driverId, int addressId, [FromBody] AddressRequest addressRequest)
    {
        bool updateResult = await _driverService.UpdateAddress(driverId, addressId, addressRequest);

        if (updateResult)
        {
            return Ok($"Updated address[{addressId}] for Driver[{driverId}] to [{addressRequest}].");
        }
        else
        {
            return BadRequest($"Confirm that driver[{driverId}] and address {addressId} exist.");
        }
    }

    [HttpDelete("{driverId:int}/address")]
    public async Task<ActionResult> DeleteDriverAddress(int driverId, int addressId)
    {
        bool deleteResult = await _driverService.DeleteDriverAddress(driverId, addressId);

        if (deleteResult)
        {
            return Ok($"Deleted address[{addressId}] for Driver[{driverId}].");
        }
        else
        {
            return BadRequest($"Confirm that driver[{driverId}] and address {addressId} exist.");
        }
    }

    [Authorize (Roles = SPONSOR)]
    [HttpPatch("{driverId:int}/points")]
    public async Task<ActionResult<Driver>> UpdateDriverPoints(int driverId, [FromBody] PointChangeRequest pointChangeRequest)
    {
        int contextUserId = _contextService.GetUserId(HttpContext);
        Sponsor? sponsor = await _sponsorService.GetSponsorByUserId(contextUserId);
        Driver? driver = await _driverService.GetDriverByDriverId(driverId);

        if (driver is null)
        {
            return BadRequest($"Could not find Driver with DriverId[{driverId}]");
        }

        OrgAccess orgAccess = await _authService.RetrieveUserOrgAccess(contextUserId, driver?.OrganizationId);

        if (sponsor is null || orgAccess != OrgAccess.ReadWrite)
        {
            _logger.LogWarning("User[{Id}] attempted to change points for driver[{DriverId}]", 
                contextUserId, driverId);
            return Unauthorized();
        }

        int oldPoints = driver!.Points;
        await _driverService.AddToDriverPointHistory(driverId, sponsor.SponsorId, pointChangeRequest);
        driver = await _driverService.GetDriverByDriverId(driverId);

        bool changeMatches = (oldPoints + pointChangeRequest.PointChange) == driver!.Points;

        if (changeMatches) 
        {
            return Ok(driver);
        }
        else
        {
            string err = $"Driver Point Update Failed [{oldPoints}]+[{pointChangeRequest.PointChange}] != [{driver!.Points}]";
            _logger.LogError("{Error}", err);
            return StatusCode(500, err);
        }
    }

    [HttpGet("{driverId:int}/pointhistory")]
    public async Task<ActionResult<List<PointHistoryRecord>>> GetDriverPointHistory(int driverId)
    {
        int contextUserId = _contextService.GetUserId(HttpContext);
        Driver? driver = await _driverService.GetDriverByDriverId(driverId);

        if (driver is null)
        {
            return BadRequest($"Could not find Driver with DriverId[{driverId}]");
        }

        OrgAccess orgAccess = await _authService.RetrieveUserOrgAccess(contextUserId, driver?.OrganizationId);

        if (orgAccess == OrgAccess.NoAccess)
        {
            return Unauthorized();
        }

        List<PointHistoryRecord> records = await _driverService.GetDriverPointHistory(driverId) ?? [];
        return records;
    }
}
