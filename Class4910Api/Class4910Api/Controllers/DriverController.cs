using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Class4910Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class DriverController : ControllerBase
{

    private readonly ILogger<DriverController> _logger;
    private readonly IContextService _contextService;
    private readonly IDriverService _driverService;
    private readonly IAuthService _authService;
    public DriverController(ILogger<DriverController> logger, IAuthService authService,
        IDriverService driverService, IContextService contextService)
    {
        _logger = logger;
        _contextService = contextService;
        _driverService = driverService;
        _authService = authService;
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
}
