using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/test/ebay")]

public class TestEbayController : ControllerBase
{
    private readonly EbayService _ebay;
    public TestEbayController(EbayService ebay)
    {
        _ebay = ebay;
    }

    [HttpGet("token")]
    public async Task<IActionResult> GetToken()
    {
        var token =  await  _ebay.GetAccessToken();
        return Ok(new { token });
    }
}