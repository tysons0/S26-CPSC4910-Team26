using Class4910Api.Models;

namespace Class4910Api.Services.Interfaces;

public interface IUserService
{
    Task<User?> FindUserByName(string username);
    Task<User?> FindUserByEmail(string email);
}
