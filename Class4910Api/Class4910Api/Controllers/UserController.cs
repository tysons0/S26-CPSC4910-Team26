using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Class4910Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class UserController : ControllerBase
{
    private readonly ILogger<UserController> _logger;
    private readonly IContextService _contextService;
    private readonly IUserService _userService;

    public UserController(ILogger<UserController> logger, IUserService userService, IContextService contextService)
    {
        _logger = logger;
        _contextService = contextService;
        _userService = userService;
    }


    [HttpPut("{updateUserId:int}")]
    public async Task<ActionResult<UserRead>> UpdateUser(int updateUserId, [FromBody] UserUpdateRequest userRequest)
    {
        int contextUserId = _contextService.GetUserId(HttpContext);
        User? userBeingUpdated = await _userService.FindUserById(updateUserId);

        _logger.LogInformation("Received request to update user with id {UserId} from user with id {RequestingUserId}", updateUserId, contextUserId);

        if (updateUserId != contextUserId || userBeingUpdated is null)
        {
            return Forbid();
        }

        _logger.LogInformation("Updating user with id {UserId}", contextUserId);

        User? updatedUser = await _userService.UpdateUser(updateUserId, userRequest);

        if (updatedUser == null)
        {
            return BadRequest("Error Updating User");
        }

        _logger.LogInformation("Successfully updated user with id {UserId}", contextUserId);
        return Ok(updatedUser.ToReadFormat());
    }
}
