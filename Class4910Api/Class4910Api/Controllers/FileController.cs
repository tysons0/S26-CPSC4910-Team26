using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Class4910Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class FileController : ControllerBase
{
    private readonly ILogger<FileController> _logger;
    private readonly IAuthService _authService;
    private readonly IContextService _contextService;
    private readonly IUserService _userService;
    private readonly IBulkUploadService _bulkUploadService;

    public FileController(
        ILogger<FileController> logger,
        IAuthService authService,
        IContextService contextService,
        IUserService userService,
        IBulkUploadService bulkUploadService)
    {
        _logger = logger;
        _authService = authService;
        _bulkUploadService = bulkUploadService;
        _contextService = contextService;
        _userService = userService;
    }

    [HttpPost("bulk-upload")]
    public async Task<ActionResult<BulkUploadResult>> BulkUpload([FromForm] BulkUploadRequest request, CancellationToken cancellationToken)
    {
        int userId = _contextService.GetUserId(HttpContext);
        User? user = await _userService.FindUserById(userId);

        if (user is null)
        {
            return Unauthorized();
        }

        _logger.LogInformation("Received bulk upload request from user {User}. File Size: {FileSize} bytes", user, request.File?.Length);

        if (request.File is null || request.File.Length == 0)
        {
            return BadRequest("A file is required.");
        }

        BulkUploadResult result = await _bulkUploadService.ProcessFileAsync(request.File, user, cancellationToken);

        _logger.LogInformation("Bulk upload result for user {User}: {Result}", user.Username, result);

        return Ok(result);
    }
}
