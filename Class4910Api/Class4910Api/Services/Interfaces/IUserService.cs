using System.Data.Common;
using Class4910Api.Models;
using Class4910Api.Models.Requests;

namespace Class4910Api.Services.Interfaces;

public interface IUserService
{
    Task<User?> FindUserByName(string username);
    Task<User?> FindUserByEmail(string email);

    Task<User?> FindUserById(int id);

    Task<User> GetUserFromReader(DbDataReader reader, string? readPrefix = null);

    Task<User?> UpdateUser(int userId, UserUpdateRequest userRequest);
}
