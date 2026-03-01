using Class4910Api.Models;
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
	private readonly ISponsorService _sponsorService;

	public CatalogController(ICatalogService catalogService, IContextService contextService, ISponsorService sponsorService)
	{
		_catalogService = catalogService;
		_contextService = contextService;
		_sponsorService = sponsorService;
	}

	[Authorize]
	[HttpGet("{orgId}")]
	public async Task<IActionResult> GetCatalog(int orgId)
	{
		return Ok(await _catalogService.GetCatalogAsync(orgId));
	}

	[Authorize(Roles = $"{ADMIN},{SPONSOR}")]
	[HttpPost("{orgId}/items")]
	public async Task<IActionResult> AddItem(int orgId, [FromBody] AddCatalogItemRequest request)
	{
		await EnsureEditAccess(orgId);
        await _catalogService.AddItemAsync(orgId, request);
		return Ok();
	}

	[Authorize(Roles = $"{ADMIN},{SPONSOR}")]
	[HttpPut("{orgId}/items/{catalogItemId}")]
	public async Task<IActionResult> UpdateItem(
		int orgId,
		int catalogItemId,
		[FromBody] UpdateCatalogItemRequest request)
	{
		await EnsureEditAccess(orgId);
        await _catalogService.UpdateItemAsync(orgId, catalogItemId, request);
		return Ok();
	}

	[Authorize(Roles = $"{ADMIN},{SPONSOR}")]
	[HttpDelete("{orgId}/items/{catalogItemId}")]
	public async Task<IActionResult> RemoveItem(int orgId, int catalogItemId)
	{
		await EnsureEditAccess(orgId);
        await _catalogService.RemoveItemAsync(orgId, catalogItemId);
		return NoContent();
	}

	private async Task EnsureEditAccess(int orgId)
	{
		int userId = _contextService.GetUserId(HttpContext);
		UserRole role = _contextService.GetUserRole(HttpContext);

		if (role == UserRole.Admin)
		{
			return;
		}
		Sponsor? sponsor = await _sponsorService.GetSponsorByUserId(userId);
		if (sponsor == null || sponsor.OrganizationId != orgId)
		{
			throw new UnauthorizedAccessException("User does not have permission to edit this catalog.");
		}
	}
}
