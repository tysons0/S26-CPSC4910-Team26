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
    private readonly IAuthService _authService;

    public UserController(ILogger<UserController> logger, IAuthService authService, IUserService userService, IContextService contextService)
    {
        _logger = logger;
        _contextService = contextService;
        _userService = userService;
        _authService = authService;
    }


    [HttpPut("{updateUserId:int}")]
    public async Task<ActionResult<UserRead>> UpdateUser(int updateUserId, [FromBody] UserUpdateRequest userRequest)
    {
        int contextUserId = _contextService.GetUserId(HttpContext);

        _logger.LogInformation("Received request to update user with id {UserId} from user with id {RequestingUserId}", updateUserId, contextUserId);

        bool hasAccessToUser = await _authService.CanUserEditOtherUser(editorUserId: contextUserId, updateUserId);

        if (hasAccessToUser == false)
            return Forbid();

        _logger.LogInformation("Updating user with id {UserId}", contextUserId);

        User? updatedUser = await _userService.UpdateUser(updateUserId, userRequest);

        if (updatedUser == null)
        {
            return BadRequest("Error Updating User");
        }

        _logger.LogInformation("Successfully updated user with id {UserId}", contextUserId);
        return Ok(updatedUser.ToReadFormat());
    }

    [HttpPatch("{updateUserId:int}/disable")]
    public async Task<ActionResult> DisableUser(int updateUserId) => await ChangeUserDisableState(updateUserId, disable: true);

    [HttpPatch("{updateUserId:int}/enable")]
    public async Task<ActionResult> EnableUser(int updateUserId) => await ChangeUserDisableState(updateUserId, disable: false);

    public async Task<ActionResult> ChangeUserDisableState(int updateUserId, bool disable)
    {
        int contextUserId = _contextService.GetUserId(HttpContext);

        bool canUpdate = await _authService.CanUserEditOtherUser(contextUserId, updateUserId);

        if (canUpdate == false)
            return Forbid();
        else
        {
            bool changeResult = await _userService.ChangeUserDisableState(updateUserId, disable);
            if (changeResult)
                return Ok();
        }

        return BadRequest();
    }
}
