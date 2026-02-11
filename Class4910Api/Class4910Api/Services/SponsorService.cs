using System.Data;
using System.Data.Common;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;
using Org.BouncyCastle.Asn1.Pkcs;
using static Class4910Api.ConstantValues;


namespace Class4910Api.Services;

public class SponsorService : ISponsorService
{
    private readonly ILogger<SponsorService> _logger;
    private readonly string _dbConnection;
    private readonly IUserService _userService;

    public SponsorService(ILogger<SponsorService> logger, IOptions<DatabaseConnection> databaseConnection, IUserService userService)
    {
        _logger = logger;
        _dbConnection = databaseConnection.Value.Connection;
        _userService = userService;
    }

    public async Task<Sponsor?> GetSponsorByName(string userName)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            await conn.OpenAsync();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT {UsersTable.GetFields(userAlias)} , {SponsorsTable.GetFields(sponsorAlias)} 
                   FROM {UsersTable.Name} {userAlias}
                   JOIN {SponsorsTable.Name} {sponsorAlias} 
                        ON {userAlias}.{UserIdField.SelectName} = {sponsorAlias}.{UserIdField.SelectName}
                   WHERE {userAlias}.{UserUserNameField.SelectName} = @UserName";
            command.Parameters.Add(UserUserNameField.GenerateParameter("@UserName", userName));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                Sponsor sponsorFromName = await GetSponsorFromReader(reader, userAlias, sponsorAlias);
                _logger.LogInformation("Retrieved Sponsor[{Sponsor}] using userName[{Name}]", sponsorFromName, userName);
                return sponsorFromName;
            }
            else
            {
                _logger.LogInformation("No Sponsor found using userName[{Name}]", userName);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Sponsor using userName[{Name}]", userName);
            return null;
        }
    }

    public async Task<Sponsor?> GetSponsorBySponsorId(int sponsorId)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            await conn.OpenAsync();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT {UsersTable.GetFields(userAlias)} , {SponsorsTable.GetFields(sponsorAlias)} 
                   FROM {UsersTable.Name} {userAlias}
                   JOIN {SponsorsTable.Name} {sponsorAlias} 
                        ON {userAlias}.{UserIdField.SelectName} = {sponsorAlias}.{UserIdField.SelectName}
                   WHERE {sponsorAlias}.{SponsorIdField.SelectName} = @SponsorId";
            command.Parameters.Add(SponsorIdField.GenerateParameter("@SponsorId", sponsorId));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                Sponsor sponsorFromName = await GetSponsorFromReader(reader, userAlias, sponsorAlias);
                _logger.LogInformation("Retrieved Sponsor[{Sponsor}] using sponsorId[{Id}]", sponsorFromName, sponsorId);
                return sponsorFromName;
            }
            else
            {
                _logger.LogInformation("No Sponsor found using sponsorId[{Id}]", sponsorId);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Sponsor using sponsorId[{Id}]", sponsorId);
            return null;
        }
    }

    public async Task<Sponsor?> GetSponsorByUserId(int userId)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            await conn.OpenAsync();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT {UsersTable.GetFields(userAlias)} , {SponsorsTable.GetFields(sponsorAlias)} 
                   FROM {UsersTable.Name} {userAlias}
                   JOIN {SponsorsTable.Name} {sponsorAlias} 
                        ON {userAlias}.{UserIdField.SelectName} = {sponsorAlias}.{UserIdField.SelectName}
                   WHERE {userAlias}.{UserIdField.SelectName} = @UserId";
            command.Parameters.Add(UserIdField.GenerateParameter("@UserId", userId));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                Sponsor sponsorFromName = await GetSponsorFromReader(reader, userAlias, sponsorAlias);
                _logger.LogInformation("Retrieved Sponsor[{Sponsor}] using userId[{Id}]", sponsorFromName, userId);
                return sponsorFromName;
            }
            else
            {
                _logger.LogInformation("No Sponsor found using userId[{Id}]", userId);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Sponsor using userId[{Id}]", userId);
            return null;
        }
    }

    private async Task<Sponsor> GetSponsorFromReader(DbDataReader reader, string? userReadPrefix = null, string? sponsorReadPrefix = null)
    {
        string pfx = sponsorReadPrefix ?? "";
        if (!string.IsNullOrWhiteSpace(pfx))
            pfx += "_";

        int sponsorId = reader.GetInt32($"{pfx}{SponsorIdField.Name}");
        int orgId = reader.GetInt32($"{pfx}{OrgIdField.Name}");

        User userData = await _userService.GetUserFromReader(reader, userReadPrefix);

        return new Sponsor
        {
            SponsorId = sponsorId,
            OrganizationId = orgId,
            UserData = userData.ToReadFormat()
        };
    }
}
