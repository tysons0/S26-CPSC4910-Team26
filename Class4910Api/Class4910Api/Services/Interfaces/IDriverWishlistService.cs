using Class4910Api.Models;
namespace Class4910Api.Services.Interfaces;

public interface IDriverWishlistService
{
    Task<IEnumerable<DriverWishlistItem>> GetWishlistAsync(int driverId);
    Task AddToWishlistAsync(int driverId, int orgId, int catalogItemId);
    Task RemoveFromWishlistAsync(int driverId, int catalogItemId);
}