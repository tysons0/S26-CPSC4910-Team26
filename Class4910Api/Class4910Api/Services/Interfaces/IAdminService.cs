using Class4910Api.Models;

namespace Class4910Api.Services.Interfaces;

public interface IAdminService
{
    Task<Admin?> GetAdminByAdminId(int adminId);
    Task<Admin?> GetAdminByUserId(int userId);

    Task<Admin?> GetAdminByName(string userName);
}
