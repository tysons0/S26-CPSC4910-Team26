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
    private readonly IBulkUploadService _bulkUploadService;

    public FileController(
        ILogger<FileController> logger,
        IAuthService authService,
        IContextService contextService,
        IBulkUploadService bulkUploadService)
    {
        _logger = logger;
        _authService = authService;
        _bulkUploadService = bulkUploadService;
        _contextService = contextService;
    }

    [HttpPost("bulk-upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<BulkUploadResult>> BulkUpload([FromForm] BulkUploadRequest request, CancellationToken cancellationToken)
    {
        UserRole userRole = _contextService.GetUserRole(HttpContext);
        if (request.File is null || request.File.Length == 0)
        {
            return BadRequest("A file is required.");
        }

        BulkUploadResult result = await _bulkUploadService.ProcessFileAsync(request.File, userRole, cancellationToken);
        return Ok(result);
    }
}
