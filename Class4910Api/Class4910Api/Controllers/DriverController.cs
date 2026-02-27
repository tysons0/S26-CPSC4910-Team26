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

    public DriverController(ILogger<DriverController> logger, IDriverService driverService, IContextService contextService)
    {
        _logger = logger;
        _contextService = contextService;
        _driverService = driverService;
    }

    [HttpGet("{userId:int}")]
    public async Task<ActionResult<Driver>> GetDriver(int userId)
    {
        UserRole role = _contextService.GetUserRole(HttpContext);
        int contextUserId = _contextService.GetUserId(HttpContext);

        Driver? driver = await _driverService.GetDriverByUserId(userId);

        if (driver is null)
        {
            return NotFound($"No driver found with ID {userId}");
        }

#warning Forbid Sponsor as well (If Not in Same Org)
        if (driver.UserData.Id != contextUserId && role == UserRole.Driver)
        {
            return Forbid($"You do not have permission to access driver with ID {contextUserId}");
        }

        return Ok(driver);
    }

    [HttpGet("{driverId:int}/address")]
    public async Task<ActionResult<List<DriverAddress>>> GetDriverAddresses(int driverId)
    {
        DriverAddress address = new()
        {
            DriverId = driverId,
            City = "City1",
            ZipCode = "29150",
            State = "South Carolina",
            AddressAlias = "Home Address",
            AddressLine1 = "1",
            AddressLine2 = "2",
            Primary = true,
        };

        DriverAddress address2 = new()
        {
            DriverId = driverId,
            City = "City2",
            ZipCode = "29151",
            State = "South Carolina",
            AddressAlias = "Work Address",
            AddressLine1 = "1",
            AddressLine2 = "2",
            Primary = false,
        };

        List<DriverAddress> addresses = [address, address2];

        return Ok(addresses);

    }

    [HttpPost("{driverId:int}/address")]
    public async Task<ActionResult<DriverAddress>> AddDriverAddress(int driverId, [FromBody] AddressRequest addressRequest)
    {

        DriverAddress address = new()
        {
            DriverId = driverId,
            City = addressRequest.City,
            ZipCode = addressRequest.ZipCode,
            State = addressRequest.State,
            AddressAlias = addressRequest.AddressAlias,
            AddressLine1 = addressRequest.AddressLine1,
            AddressLine2 = addressRequest.AddressLine2,
            Primary = addressRequest.Primary,
        };

        return Ok(address);
    }

    [HttpPost("{driverId:int}/address/{addressId:int}")]
    public async Task<ActionResult> ChangePrimaryAddress(int driverId, int addressId)
    {
        return Ok("Changed Primary Address");
    }

    [HttpPut("{driverId:int}/address/{addressId:int}")]
    public async Task<ActionResult> UpdateAddress(int driverId, int addressId, [FromBody] AddressRequest addressRequest)
    {
        return Ok("Updated");
    }

    [HttpDelete("{driverId:int}/address")]
    public async Task<ActionResult> DeleteDriverAddress(int driverId, [FromBody] AddressRequest addressRequest)
    {
        return Ok("Deleted");
    }
}
