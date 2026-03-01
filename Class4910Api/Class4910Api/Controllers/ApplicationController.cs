using Class4910Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using static Class4910Api.ConstantValues;

namespace Class4910Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class ApplicationController : ControllerBase
{
    [Authorize(Roles = $"{ADMIN},{SPONSOR}")]
    [HttpPost("{applicationId:int}/status")]
    public async Task<ActionResult> ChangeApplicationStatus(int applicationId, 
        [FromQuery] string newStatus, [FromQuery] string changeReason)
    {

        return Ok(newStatus);
    }

    [Authorize(Roles = DRIVER)]
    [HttpPost("{orgId:int}/apply")]
    public async Task<ActionResult> CreateApplication(int orgId, [FromBody] string message)
    {

        return Ok("");
    }

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<List<DriverApplication>>> GetApplications()
    {
        DriverApplication application1 = new()
        {
            ApplicationId = 1,
            DriverId = 1,
            OrgId = 1,
            DriverMessage = "Example",
            CreatedAtUtc = DateTime.UtcNow,
            LastModifiedUtc = DateTime.UtcNow,
            Status = "Waiting"
        };
        DriverApplication application2 = new()
        {
            ApplicationId = 2,
            DriverId = 2,
            OrgId = 2,
            DriverMessage = "Example2",
            CreatedAtUtc = DateTime.UtcNow,
            LastModifiedUtc = DateTime.UtcNow,
            Status = "Waiting"
        };

        List<DriverApplication> applications = [application1, application2];
        
        return Ok(applications);
    }
}
