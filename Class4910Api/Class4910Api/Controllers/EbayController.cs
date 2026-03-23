using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Class4910Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class EbayController : ControllerBase
{
    private readonly IEbayService _ebayService;
    private readonly ILogger<EbayController> _logger;

    public EbayController(IEbayService ebayService, ILogger<EbayController> logger)
    {
        _ebayService = ebayService;
        _logger = logger;
    }

    [HttpGet("OAuth")]
    public async Task<ActionResult<string>> GetAccessToken()
    {
        try
        {
            string token = await _ebayService.GetAccessToken();
            return Ok(new { token });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error obtaining eBay OAuth token");
            return StatusCode(500, new { error = "Failed to obtain OAuth token", details = ex.Message });
        }
    }


    [HttpGet("products")]
    public async Task<ActionResult<EbaySearchResponse>> SearchProducts(
        [FromQuery] string keyword = "electronics",
        [FromQuery] int limit = 12)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest(new { error = "Keyword is required" });

            if (limit < 1 || limit > 50)
                return BadRequest(new { error = "Limit must be between 1 and 50" });

            EbaySearchResponse result = await _ebayService.SearchProductsAsync(keyword, limit);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching eBay products");
            return StatusCode(500, new { error = "Failed to search products", details = ex.Message });
        }
    }

    [HttpGet("products/{itemId}")]
    public async Task<ActionResult<EbayProduct>> GetProduct(string itemId)
    {
        var product = await _ebayService.GetProductByIDAsync(itemId);

        if (product == null)
            return NotFound(new { error = "Product not found or unavailable" });

        return Ok(product);
    }
}