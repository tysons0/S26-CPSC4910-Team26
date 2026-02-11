using Class4910Api.Models;

namespace Class4910Api.Services.Interfaces;

public interface IDriverService
{
    Task<Driver?> GetDriverByDriverId(int driverId);
    Task<Driver?> GetDriverByUserId(int userId);

    Task<Driver?> GetDriverByName(string userName);
}
