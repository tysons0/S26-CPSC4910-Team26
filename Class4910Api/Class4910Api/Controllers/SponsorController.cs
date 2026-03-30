using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static Class4910Api.ConstantValues;

namespace Class4910Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class SponsorController : ControllerBase
{
    private readonly ISponsorService _sponsorService;
    private readonly IContextService _contextService;

    public SponsorController(ISponsorService sponsorService, IContextService contextService)
    {
        _sponsorService = sponsorService;
        _contextService = contextService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Sponsor>>> GetSponsors()
    {
        List<Sponsor>? sponsorList = await _sponsorService.GetAllSponsors();

        if (sponsorList is null)
            return BadRequest();
        else
            return Ok(sponsorList);
    }

    [Authorize(Roles = SPONSOR)]
    [HttpGet("me")]
    public async Task<ActionResult<Sponsor>> GetCurrentSponsor()
    {
        int userId = _contextService.GetUserId(HttpContext);
        Sponsor? sponsor = await _sponsorService.GetSponsorByUserId(userId);

        if (sponsor is null)
        {
            return NotFound("Sponsor profile not found.");
        }

        return Ok(sponsor);
    }
}
