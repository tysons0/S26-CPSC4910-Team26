using System.Data;
using System.Data.Common;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;

using static Class4910Api.Configuration.ConstantValues;

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

    private async Task<User> GetUserFromReader(DbDataReader reader)
    {
        int id = reader.GetInt32(UserIdField.Name);
        string username = reader.GetString(UserUserNameField.Name);

        int emailOrdinal = reader.GetOrdinal(UserEmailField.Name);
        string? email = null;
        if (!reader.IsDBNull(emailOrdinal))
        {
            reader.GetString(UserEmailField.Name);
        }

        string passwordHash = reader.GetString(UserHashedPasswordField.Name);
        DateTime createdAtUtc = reader.GetDateTime(UserCreatedAtUtcField.Name);

        return new User
        {
            Id = id,
            Username = username,
            Email = email,
            PasswordHash = passwordHash,
            CreatedAtUtc = createdAtUtc,
            Role = await GetUserRoleFrom(id)
        };
    }

    private async Task<UserRole> GetUserRoleFrom(int id)
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
