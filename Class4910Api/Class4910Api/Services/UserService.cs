using System.Data;
using System.Data.Common;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;

using static Class4910Api.ConstantValues;

namespace Class4910Api.Services;

public class UserService : IUserService
{
    private readonly ILogger<UserService> _logger;
    private readonly string _dbConnection;

    public UserService(ILogger<UserService> logger, IOptions<DatabaseConnection> databaseConnection)
    {
        _logger = logger;
        _dbConnection = databaseConnection.Value.Connection;
    }

    public async Task<User?> FindUserByEmail(string email)
    {
        try
        {
            _logger.LogInformation("Retrieve user using email[{Email}]", email);

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT * 
                   FROM {UsersTable.Name}
                   WHERE {UserEmailField.SelectName} = @Email";
            command.Parameters.Add(UserEmailField.GenerateParameter("@Email", email));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                User userFromEmail = await GetUserFromReader(reader);
                _logger.LogInformation("Retrieved User[{User}] using email[{Email}]", userFromEmail, email);
                return userFromEmail;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding user for email[{Email}]. Error[{Err}]", email, ex.Message);
            return null;
        }
    }

    public async Task<User?> FindUserById(int id)
    {
        try
        {
            _logger.LogInformation("Retrieve user using id[{Id}]", id);

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT * 
                   FROM {UsersTable.Name}
                   WHERE {UserIdField.SelectName} = @Id";
            command.Parameters.Add(UserEmailField.GenerateParameter("@Id", id));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                User userFromId = await GetUserFromReader(reader);
                _logger.LogInformation("Retrieved User[{User}] using id[{Id}]", userFromId, id);
                return userFromId;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding user for id[{Id}]. Error[{Err}]", id, ex.Message);
            return null;
        }
    }

    public async Task<User?> FindUserByName(string username)
    {
        await using MySqlConnection conn = new(_dbConnection);
        conn.Open();
        MySqlCommand command = conn.CreateCommand();

        command.CommandText =
                @$"SELECT * 
                   FROM {UsersTable.Name}
                   WHERE {UserUserNameField.SelectName} = @Username";
        command.Parameters.Add(UserUserNameField.GenerateParameter("@Username", username));

        await using DbDataReader reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            User userFromName = await GetUserFromReader(reader);
            _logger.LogInformation("Retrieved User[{User}] using username[{Name}]", userFromName, username);
            return userFromName;
        }

        return null;
    }

    public async Task<User> GetUserFromReader(DbDataReader reader, string? readPrefix = null)
    {
        string pfx = readPrefix ?? "";
        if (!string.IsNullOrWhiteSpace(pfx))
            pfx += "_";

        int id = reader.GetInt32($"{pfx}{UserIdField.Name}");
        string username = reader.GetString($"{pfx}{UserUserNameField.Name}");

        int emailOrdinal = reader.GetOrdinal($"{pfx}{UserEmailField.Name}");
        string? email = null;
        if (!reader.IsDBNull(emailOrdinal))
        {
            reader.GetString($"{pfx}{UserEmailField.Name}");
        }

        string passwordHash = reader.GetString($"{pfx}{UserHashedPasswordField.Name}");
        DateTime createdAtUtc = reader.GetDateTime($"{pfx}{UserCreatedAtUtcField.Name}");

        return new User
        {
            Id = id,
            Username = username,
            Email = email,
            PasswordHash = passwordHash,
            CreatedAtUtc = createdAtUtc,
            Role = await GetUserRoleFromId(id)
        };
    }

    private async Task<UserRole> GetUserRoleFromId(int id)
    {
        await using MySqlConnection conn = new(_dbConnection);
        conn.Open();
        MySqlCommand command = conn.CreateCommand();

        string returnName = "UserRole";

        command.CommandText = 
        @$"SELECT
           CASE
             WHEN EXISTS (SELECT 1 FROM {AdminsTable.Name} WHERE {UserIdField.SelectName} = @UserId) THEN 'Admin'
             WHEN EXISTS (SELECT 1 FROM {DriversTable.Name}  WHERE {UserIdField.SelectName} = @UserId) THEN 'Driver'
             WHEN EXISTS (SELECT 1 FROM {SponsorsTable.Name} WHERE {UserIdField.SelectName} = @UserId) THEN 'Sponsor'
             ELSE 'User'
           END AS {returnName};";

        command.Parameters.Add(UserIdField.GenerateParameter("@UserId", id));

        await using DbDataReader reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            string role = reader.GetString(returnName);
            return Enum.Parse<UserRole>(role);
        }

        return UserRole.User;
    }
}
