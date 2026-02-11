using System.Data.Common;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using System.Data;
using MySql.Data.MySqlClient;


using static Class4910Api.ConstantValues;

namespace Class4910Api.Services;

public class DriverService : IDriverService
{
    private readonly ILogger<DriverService> _logger;
    private readonly string _dbConnection;
    private readonly IUserService _userService;

    public DriverService(ILogger<DriverService> logger, IOptions<DatabaseConnection> databaseConnection, IUserService userService)
    {
        _logger = logger;
        _dbConnection = databaseConnection.Value.Connection;
        _userService = userService;
    }

    public async Task<Driver?> GetDriverByDriverId(int driverId)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT {UsersTable.GetFields(userAlias)} , {DriversTable.GetFields(driverAlias)} 
                   FROM {UsersTable.Name} {userAlias}
                   JOIN {DriversTable.Name} {driverAlias} ON {userAlias}.{UserIdField.SelectName} = {driverAlias}.{UserIdField.SelectName}
                   WHERE {driverAlias}.{DriverIdField.SelectName} = @DriverId";
            command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", driverId));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                Driver driverFromUserId = await GetDriverFromReader(reader, userAlias, driverAlias);
                _logger.LogInformation("Retrieved Driver[{Driver}] using driverId[{Id}]", driverFromUserId, driverId);
                return driverFromUserId;
            }
            else
            {
                _logger.LogInformation("No Driver found using driverId[{Id}]", driverId);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Driver using driverId[{Id}]", driverId);
            return null;
        }
    }

    public async Task<Driver?> GetDriverByName(string userName)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT {UsersTable.GetFields(userAlias)} , {DriversTable.GetFields(driverAlias)}  
                   FROM {UsersTable.Name} {userAlias}
                   JOIN {DriversTable.Name} {driverAlias} ON {userAlias}.{UserIdField.SelectName} = {driverAlias}.{UserIdField.SelectName}
                   WHERE {userAlias}.{UserUserNameField.SelectName} = @UserName";
            command.Parameters.Add(UserUserNameField.GenerateParameter("@UserName", userName));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                Driver driverFromUserId = await GetDriverFromReader(reader, userAlias, driverAlias);
                _logger.LogInformation("Retrieved Driver[{Driver}] using userName[{Name}]", driverFromUserId, userName);
                return driverFromUserId;
            }
            else
            {
                _logger.LogInformation("No Driver found using userName[{Name}]", userName);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Driver using userName[{Name}]", userName);
            return null;
        }
    }

    public async Task<Driver?> GetDriverByUserId(int userId)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT {UsersTable.GetFields(userAlias)} , {DriversTable.GetFields(driverAlias)} 
                   FROM {UsersTable.Name} {userAlias}
                   JOIN {DriversTable.Name} {driverAlias} 
                       ON {userAlias}.{UserIdField.SelectName} = {driverAlias}.{UserIdField.SelectName}
                   WHERE {userAlias}.{UserIdField.SelectName} = @UserId";
            command.Parameters.Add(UserIdField.GenerateParameter("@UserId", userId));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                Driver driverFromUserId = await GetDriverFromReader(reader, userAlias, driverAlias);
                _logger.LogInformation("Retrieved Driver[{Driver}] using userId[{Id}]", driverFromUserId, userId);
                return driverFromUserId;
            }
            else
            {
                _logger.LogInformation("No Driver found using userId[{Id}]", userId);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Driver using userId[{Id}]", userId);
            return null;
        }
    }

    private async Task<Driver> GetDriverFromReader(DbDataReader reader, string? userReadPrefix = null, string? driverReadPrefix = null)
    {
        string pfx = driverReadPrefix ?? "";
        if (!string.IsNullOrWhiteSpace(pfx))
            pfx += "_";

        int driverId = reader.GetInt32($"{pfx}{DriverIdField.Name}");
        string? orgIdBeforeParse = reader[$"{pfx}{OrgIdField.Name}"].ToString();

        int? orgId = null;
        if (!string.IsNullOrWhiteSpace(orgIdBeforeParse))
        {
            orgId = int.Parse(orgIdBeforeParse);
        }

        User userData = await _userService.GetUserFromReader(reader, userReadPrefix);

        return new Driver()
        {
            DriverId = driverId,
            OrganizationId = orgId,
            UserData = userData.ToReadFormat()
        };
    }
}
