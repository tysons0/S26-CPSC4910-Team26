using System.Data;
using System.Data.Common;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;
using static Class4910Api.ConstantValues;

namespace Class4910Api.Services;

public class OrganizationService : IOrganizationService
{
    private readonly ILogger<OrganizationService> _logger;
    private readonly string _dbConnection;

    public OrganizationService(ILogger<OrganizationService> logger, IOptions<DatabaseConnection> databaseConnection)
    {
        _logger = logger;
        _dbConnection = databaseConnection.Value.Connection;
    }

    public async Task<Organization?> CreateOrganization(OrganizationCreationRequest creationRequest, int creatorUserId)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"INSERT INTO {OrgsTable.Name}
                   ({OrgNameField.SelectName}, {OrgDescriptionField.SelectName}, {OrgCreatedAtUtcField.SelectName}) VALUES
                   (@OrgName, @OrgDesc, @CreatedAtUtc);";
            command.Parameters.Add(OrgNameField.GenerateParameter("@OrgName", creationRequest.Name));
            command.Parameters.Add(OrgDescriptionField.GenerateParameter("@OrgDesc", creationRequest.Description));
            command.Parameters.Add(OrgCreatedAtUtcField.GenerateParameter("@CreatedAtUtc", DateTime.UtcNow));

            await command.ExecuteNonQueryAsync();

            int newOrgId = (int)command.LastInsertedId;

            Organization? newOrg = await GetOrganizationById(newOrgId);

            return newOrg;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating organization with request[{Request}] for User[{Id}]", 
                creationRequest, creatorUserId);
            return null;
        }
    }

    public async Task<Organization?> GetOrganizationById(int organizationId)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT * 
                   FROM {OrgsTable.Name}
                   WHERE {OrgIdField.SelectName} = @OrgId";
            command.Parameters.Add(UserUserNameField.GenerateParameter("@OrgId", organizationId));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                Organization orgFromid = await GetOrganizationFromReader(reader);
                _logger.LogInformation("Retrieved Organization[{Org}] using orgId[{Id}]", orgFromid, organizationId);
                return orgFromid;
            }
            else
            {
                _logger.LogInformation("No Organization found using orgId[{Id}]", organizationId);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Organization using orgId[{Id}]", organizationId);
            return null;
        }
    }

    public async Task<Organization?> GetOrganizationByName(string orgName)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT * 
                   FROM {OrgsTable.Name}
                   WHERE {OrgNameField.SelectName} = @OrgName";
            command.Parameters.Add(OrgNameField.GenerateParameter("@OrgName", orgName));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                Organization orgFromid = await GetOrganizationFromReader(reader);
                _logger.LogInformation("Retrieved Organization[{Org}] using orgName[{Name}]", orgFromid, orgName);
                return orgFromid;
            }
            else
            {
                _logger.LogInformation("No Organization found using orgName[{Name}]", orgName);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Organization using orgName[{Name}]", orgName);
            return null;
        }
    }

    public async Task<List<Organization>?> GetOrganizations()
    {
        try
        {
            List<Organization> orgs = [];
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT * 
                   FROM {OrgsTable.Name}";

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                Organization org = await GetOrganizationFromReader(reader);
                orgs.Add(org);
            }

            _logger.LogInformation("Retrieved all Organizations, count[{Count}]", orgs.Count);
            return orgs;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding organizations");
            return null;
        }
    }

    public async Task<Organization?> UpdateOrganizationPointValue(int organizationId, float newPointValue, int updaterUserId)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"UPDATE {OrgsTable.Name}
                   SET {OrgPointWorthField.SelectName} = @NewPointWorth
                   WHERE {OrgIdField.SelectName} = @OrgId";

            command.Parameters.Add(OrgPointWorthField.GenerateParameter("@NewPointWorth", newPointValue));
            command.Parameters.Add(OrgIdField.GenerateParameter("@OrgId", organizationId));

            await command.ExecuteNonQueryAsync();

            Organization? updatedOrg = await GetOrganizationById(organizationId);

            if (updatedOrg != null)
            {
                _logger.LogInformation("Updated Organization[{Org}] point value to newPointValue[{NewPointValue}] using orgId[{Id}] for User[{UserId}]",
                    updatedOrg, newPointValue, organizationId, updaterUserId);
                return updatedOrg;
            }
            else
            {
                _logger.LogWarning("No Organization found to update using orgId[{Id}]", organizationId);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Organization point value using orgId[{Id}] with newPointValue[{NewPointValue}] for User[{UserId}]",
                organizationId, newPointValue, updaterUserId);
            return null;
        }
    }

    private async Task<Organization> GetOrganizationFromReader(DbDataReader reader, string? readPrefix = null)
    {
        string pfx = readPrefix ?? "";

        int id = reader.GetInt32($"{pfx}{OrgIdField.Name}");
        string name = reader.GetString($"{pfx}{OrgNameField.Name}");
        string? description = reader[$"{pfx}{OrgDescriptionField.Name}"].ToString();
        DateTime createdAtUtc = reader.GetDateTime($"{pfx}{OrgCreatedAtUtcField.Name}");
        double pointWorth = reader.GetDouble($"{pfx}{OrgPointWorthField.Name}");

        return new Organization
        {
            OrgId = id,
            Name = name,
            Description = description,
            CreatedAtUtc = createdAtUtc,
            PointWorth = pointWorth
        };
    }
}
