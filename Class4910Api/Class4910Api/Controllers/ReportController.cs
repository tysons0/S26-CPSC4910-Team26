using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Class4910Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class ReportController : ControllerBase
{
}
