using System.Data;
using System.Data.Common;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;

using static Class4910Api.ConstantValues;

namespace Class4910Api.Services;

public class AdminService : IAdminService
{
    private readonly ILogger<AdminService> _logger;
    private readonly string _dbConnection;
    private readonly IUserService _userService;

    public AdminService(ILogger<AdminService> logger, IOptions<DatabaseConnection> databaseConnection, IUserService userService)
    {
        _logger = logger;
        _dbConnection = databaseConnection.Value.Connection;
        _userService = userService;
    }

    public async Task<Admin?> GetAdminByAdminId(int adminId)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT * 
                   FROM {UsersTable.Name} user
                   JOIN {AdminsTable.Name} admin ON user.{UserIdField.SelectName} = admin.{UserIdField.SelectName}
                   WHERE admin.{AdminIdField.SelectName} = @AdminId";
            command.Parameters.Add(UserUserNameField.GenerateParameter("@AdminId", adminId));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                Admin adminFromUserId = await GetAdminFromReader(reader);
                _logger.LogInformation("Retrieved Admin[{Admin}] using adminId[{Id}]", adminFromUserId, adminId);
                return adminFromUserId;
            }
            else
                throw new($"No data found.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Admin using adminId[{Id}]", adminId);
            return null;
        }
    }

    public async Task<Admin?> GetAdminByName(string userName)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT * 
                   FROM {UsersTable.Name} user
                   JOIN {AdminsTable.Name} admin ON user.{UserIdField.SelectName} = admin.{UserIdField.SelectName}
                   WHERE user.{UserUserNameField.SelectName} = @UserName";
            command.Parameters.Add(UserUserNameField.GenerateParameter("@UserName", userName));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                Admin adminFromUserId = await GetAdminFromReader(reader);
                _logger.LogInformation("Retrieved Admin[{Admin}] using UserName[{Name}]", adminFromUserId, userName);
                return adminFromUserId;
            }
            else
                throw new($"No data found.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Admin using UserName[{Name}]", userName);
            return null;
        }
    }

    public async Task<Admin?> GetAdminByUserId(int userId)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                    @$"SELECT * 
                   FROM {UsersTable.Name} user
                   JOIN {AdminsTable.Name} admin ON user.{UserIdField.SelectName} = admin.{UserIdField.SelectName}
                   WHERE user.{UserIdField.SelectName} = @UserId";
            command.Parameters.Add(UserUserNameField.GenerateParameter("@UserId", userId));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                Admin adminFromUserId = await GetAdminFromReader(reader);
                _logger.LogInformation("Retrieved Admin[{Admin}] using userId[{Id}]", adminFromUserId, userId);
                return adminFromUserId;
            }
            else
                throw new($"No data found.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Admin using userId[{Id}]", userId);
            return null;
        }
    }

    public async Task<Admin> GetAdminFromReader(DbDataReader reader, string? userReadPrefix = null, string? adminReadPrefix = null)
    {
        string pfx = adminReadPrefix ?? "";

        int adminId = reader.GetInt32($"{pfx}{AdminIdField.Name}");

        User userData = _userService.GetUserFromReader(reader, userReadPrefix).Result;
        return new Admin
        {
            AdminId = adminId,
            UserData = userData.ToReadFormat()
        };
    }
}
