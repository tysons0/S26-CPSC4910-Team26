using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace Class4910Api.Controllers;

[ApiController]
[Route("[controller]")]
public class DriverWishlistController : ControllerBase
{
    private readonly IDriverWishlistService _wishlistService;
    private readonly IContextService _contextService;
    private readonly IDriverService _driverService;

    public DriverWishlistController(IDriverWishlistService wishlistService, IContextService contextService, IDriverService driverService)
    {
        _wishlistService = wishlistService;
        _contextService = contextService;
        _driverService = driverService;
    }

    [Authorize]
    [HttpGet("{driverId}")]
    public async Task<ActionResult<IEnumerable<DriverWishlistItem>>> GetWishlist(int driverId)
    {
        var wishlist = await _wishlistService.GetWishlistAsync(driverId);
        return Ok(wishlist);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> AddToWishlist([FromBody] DriverWishlist item)
    {
        await _wishlistService.AddToWishlistAsync(item.DriverID, item.OrgID, item.CatalogItemID);
        return Ok();
    }

    [Authorize]
    [HttpDelete("{catalogItemId:int}")]
    public async Task<IActionResult> RemoveFromWishlist(int catalogItemId)
    {
        int userId = _contextService.GetUserId(HttpContext);
        var driver = await _driverService.GetDriverByUserId(userId);
        if (driver is null)
        {
            return BadRequest("Driver not found for the current user.");
        }

        await _wishlistService.RemoveFromWishlistAsync(driver.DriverId, catalogItemId);
        return Ok();
    }
}