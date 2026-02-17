using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Class4910Api.Controllers
{
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

        [HttpGet("products")]
        public async Task<IActionResult> SearchProducts(
            [FromQuery] string keyword = "electronics",
            [FromQuery] int limit = 12)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(keyword))
                    return BadRequest(new { error = "Keyword is required" });

                if (limit < 1 || limit > 50)
                    return BadRequest(new { error = "Limit must be between 1 and 50" });

                var result = await _ebayService.SearchProductsAsync(keyword, limit);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching eBay products");
                return StatusCode(500, new { error = "Failed to search products", details = ex.Message });
            }
        }
    }
}