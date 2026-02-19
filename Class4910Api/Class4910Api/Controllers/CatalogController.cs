using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static Class4910Api.ConstantValues;

namespace Class4910Api.Controllers;

[ApiController]
[Route("api/catalog")]
public class CatalogController : ControllerBase
{
	private readonly ICatalogService _catalogService;
	private readonly IContextService _contextService;

	public CatalogController(ICatalogService catalogService, IContextService contextService)
	{
		_catalogService = catalogService;
		_contextService = contextService;
	}

	[Authorize]
	[HttpGet]
	public async Task<IActionResult> GetCatalog()
	{
		int orgId = _contextService.GetOrgId(HttpContext);
		return Ok(await _catalogService.GetCatalogAsync(orgId));
	}

	[Authorize(Roles = $"{ADMIN},{SPONSOR}")]
	[HttpPost("items")]
	public async Task<IActionResult> AddItem([FromBody] AddCatalogItemRequest request)
	{
		int orgId = _contextService.GetOrgId(HttpContext);
		await _catalogService.AddItemAsync(orgId, request);
		return Ok();
	}

	[Authorize(Roles = $"{ADMIN},{SPONSOR}")]
	[HttpPut("items/{catalogItemId}")]
	public async Task<IActionResult> UpdateItem(
		int catalogItemId,
		[FromBody] UpdateCatalogItemRequest request)
	{
		int orgId = _contextService.GetOrgId(HttpContext);
		await _catalogService.UpdateItemAsync(orgId, catalogItemId, request);
		return Ok();
	}

	[Authorize(Roles = $"{ADMIN},{SPONSOR}")]
	[HttpDelete("items/{catalogItemId}")]
	public async Task<IActionResult> RemoveItem(int catalogItemId)
	{
		int orgId = _contextService.GetOrgId(HttpContext);
		await _catalogService.RemoveItemAsync(orgId, catalogItemId);
		return NoContent();
	}
}
