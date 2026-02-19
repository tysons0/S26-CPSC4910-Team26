using Class4910Api.Models;
using Class4910.Models.Requests;
namespace Class4910Api.Services.Interfaces;

public interface IcatalogService
{
    Task<IEnumerable<CatalogItem>> GetCatalogAsync(int orgID);
    Task AddItemAsync(int orgId, AddCatalogItemRequest request);
    Task UpdateItemAsync(int orgId, int catalogItemId, UpdateCatalogItemRequest request);
    Task RemoveItemAsync(int orgId, int catalogItemId);
}