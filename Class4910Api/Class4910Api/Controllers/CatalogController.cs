using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/test/ebay")]

public class TestEbayController : ControllerBase
{
    private readonly IEbayService _ebay;
    public TestEbayController(IEbayService ebay)
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