using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("controllers")]
public class TestController : ControllerBase
{
    private readonly EmailService _emailService;

    public TestController(EmailService emailService)
    {
        _emailService = emailService;
    }

    [HttpGet("email")]
    public async Task<IActionResult> SendTestEmail()
    {
        await _emailService.SendEmailAsync(
            "david101cccp@gmail.com",
            "Test Email",
            "<h1>It works locally 🎉</h1>"
        );

        return Ok("Email sent!");
    }
}
