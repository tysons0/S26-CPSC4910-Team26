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
    public DriverWishlistController(IDriverWishlistService wishlistService)
    {
        _wishlistService = wishlistService;
    }

    [Authorize]
    [HttpGet("{driverId}")]
    public async Task<ActionResult<IEnumerable<DriverWishlist>>> GetWishlist(int driverId)
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
    [HttpDelete]
    public async Task<IActionResult> RemoveFromWishlist([FromBody] DriverWishlist item)
    {
        await _wishlistService.RemoveFromWishlistAsync(item.DriverID, item.CatalogItemID);
        return Ok();
    }
}