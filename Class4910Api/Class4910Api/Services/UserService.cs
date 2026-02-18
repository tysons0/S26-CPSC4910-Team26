using System.Data;
using System.Data.Common;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
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
        // I hate how bulky this method is but I think creating a SQL Helper is awful to test
        // I don't understand why reader.GetString could not just grab null if the value is DBNull instead of throwing
        string pfx = readPrefix ?? "";
        if (!string.IsNullOrWhiteSpace(pfx))
            pfx += "_";

        int id = reader.GetInt32($"{pfx}{UserIdField.Name}");
        string username = reader.GetString($"{pfx}{UserUserNameField.Name}");

        string passwordHash = reader.GetString($"{pfx}{UserHashedPasswordField.Name}");
        DateTime createdAtUtc = reader.GetDateTime($"{pfx}{UserCreatedAtUtcField.Name}");

        string? email = null;
        int emailOrdinal = reader.GetOrdinal($"{pfx}{UserEmailField.Name}");
        if (!reader.IsDBNull(emailOrdinal))
        {
            email = reader.GetString(emailOrdinal);
        }

        string? firstName = null;
        int firstNameOrdinal = reader.GetOrdinal($"{pfx}{UserFirstNameField.Name}");
        if (!reader.IsDBNull(firstNameOrdinal))
        {
            firstName = reader.GetString(firstNameOrdinal);
        }
        string? lastName = null;
        int lastNameOrdinal = reader.GetOrdinal($"{pfx}{UserLastNameField.Name}");
        if (!reader.IsDBNull(lastNameOrdinal))
        {
            lastName = reader.GetString(lastNameOrdinal);
        }
        string? phoneNumber = null;
        int phoneOrdinal = reader.GetOrdinal($"{pfx}{UserPhoneField.Name}");
        if (!reader.IsDBNull(phoneOrdinal))
        {
            phoneNumber = reader.GetString(phoneOrdinal);
        }
        string? timeZone = null;
        int timeZoneOrdinal = reader.GetOrdinal($"{pfx}{UserTimeZoneField.Name}");
        if (!reader.IsDBNull(timeZoneOrdinal))
        {
            timeZone = reader.GetString(timeZoneOrdinal);
        }
        string? country = null;
        int countryOrdinal = reader.GetOrdinal($"{pfx}{UserCountryField.Name}");
        if (!reader.IsDBNull(countryOrdinal))
        {
            country = reader.GetString(countryOrdinal);
        }
        DateTime? lastLoginUtc = null;
        int lastLoginOrdinal = reader.GetOrdinal($"{pfx}{UserLastLoginTimeUtcField.Name}");
        if (!reader.IsDBNull(lastLoginOrdinal))
        {
            lastLoginUtc = reader.GetDateTime(lastLoginOrdinal);
        }

        return new User
        {
            Id = id,
            Username = username,
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            PasswordHash = passwordHash,
            CreatedAtUtc = createdAtUtc,
            Role = await GetUserRoleFromId(id),

            PhoneNumber = phoneNumber,
            TimeZone = timeZone,
            Country = country,
            LastLoginUtc = lastLoginUtc
        };
    }

    public async Task<User?> UpdateUser(int userId, UserUpdateRequest userRequest)
    {
        _logger.LogInformation("Updating user[{UserId}] with request[{Request}]", userId, userRequest);

        await using MySqlConnection conn = new(_dbConnection);
        conn.Open();
        MySqlCommand command = conn.CreateCommand();

        command.CommandText =
                @$"UPDATE {UsersTable.Name} 
                   SET {UserFirstNameField.SelectName} = @FirstName,
                       {UserLastNameField.SelectName} = @LastName,
                       {UserEmailField.SelectName} = @Email,
                       {UserPhoneField.SelectName} = @PhoneNumber,
                       {UserTimeZoneField.SelectName} = @TimeZone,
                       {UserCountryField.SelectName} = @Country
                   WHERE {UserIdField.SelectName} = @UserId";
        command.Parameters.Add(UserIdField.GenerateParameter("@UserId", userId));
        command.Parameters.Add(UserFirstNameField.GenerateParameter("@FirstName", userRequest.FirstName));
        command.Parameters.Add(UserLastNameField.GenerateParameter("@LastName", userRequest.LastName));
        command.Parameters.Add(UserEmailField.GenerateParameter("@Email", userRequest.Email));
        command.Parameters.Add(UserPhoneField.GenerateParameter("@PhoneNumber", userRequest.PhoneNumber));
        command.Parameters.Add(UserTimeZoneField.GenerateParameter("@TimeZone", userRequest.TimeZone));
        command.Parameters.Add(UserCountryField.GenerateParameter("@Country", userRequest.Country));

        int result = await command.ExecuteNonQueryAsync();

        _logger.LogInformation("Updated user[{UserId}] with request[{Request}]. Result[{Result}]", userId, userRequest, result);

        return await FindUserById(userId);
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
