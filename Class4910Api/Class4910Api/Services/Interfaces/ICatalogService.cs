using Class4910Api.Models;
using Class4910Api.Models.Requests;
namespace Class4910Api.Services.Interfaces;

public interface ICatalogService
{
    Task<IEnumerable<CatalogItem>> GetCatalogAsync(int orgID);
    Task AddItemAsync(int orgId, AddCatalogItemRequest request);
    Task UpdateItemAsync(int orgId, int catalogItemId, UpdateCatalogItemRequest request);
    Task RemoveItemAsync(int orgId, int catalogItemId);
}