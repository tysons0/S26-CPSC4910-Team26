using Class4910Api.Models;
using Class4910Api.Models.Requests;
namespace Class4910Api.Services.Interfaces;

public interface IDriverWishlistService
{
    Task<IEnumerable<DriverWishlist>> GetWishlistAsync(int driverId);
    Task AddToWishlistAsync(int driverId, int orgId, int catalogItemId);
    Task RemoveFromWishlistAsync(int driverId, int catalogItemId);
}