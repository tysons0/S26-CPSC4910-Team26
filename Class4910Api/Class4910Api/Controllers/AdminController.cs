using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Class4910Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IContextService _contextService;

    public AdminController(IAdminService adminService, IContextService contextService)
    {
        _adminService = adminService;
        _contextService = contextService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Admin>>> GetAdmins()
    {
        List<Admin>? adminList = await _adminService.GetAllAdmins();

        if (adminList is null)
            return BadRequest();
        else
            return Ok(adminList);
    }
}
