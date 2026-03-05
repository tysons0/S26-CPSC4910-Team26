using System.Data;
using System.Data.Common;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;

using static Class4910Api.ConstantValues;

namespace Class4910Api.Services;

public class ApplicationService : IApplicationService
{
    private readonly ILogger<ApplicationService> _logger;
    private readonly string _dbConnection;

    public ApplicationService(ILogger<ApplicationService> logger, IOptions<DatabaseConnection> databaseConnection)
    {
        _logger = logger;
        _dbConnection = databaseConnection.Value.Connection;
    }


    public async Task<bool> CreateApplication(int driverId, int orgId, string message)
    {
        _logger.LogInformation("Create application for Driver[{Id}] to Organization[{Id}]", driverId, orgId);
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"INSERT INTO {DriverApplicationsTable.Name}
                   ({DriverIdField.SelectName}, {OrgIdField.SelectName}, {ApplicationDriverMessageField.SelectName},
                    {ApplicationCreatedAtUtcField.SelectName}, {ApplicationLastModifiedUtcField.SelectName}) 
                   VALUES
                   (@DriverId, @OrgId, @DriverMessage, 
                    @UtcNow, @UtcNow);";
            command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", driverId));
            command.Parameters.Add(OrgIdField.GenerateParameter("@OrgId", orgId));
            command.Parameters.Add(ApplicationDriverMessageField.GenerateParameter("@DriverMessage", message));
            command.Parameters.Add(OrgCreatedAtUtcField.GenerateParameter("@UtcNow", DateTime.UtcNow));

            await command.ExecuteNonQueryAsync();

            int newApplicationId = (int)command.LastInsertedId;

            _logger.LogInformation("Created application[{Id}] for Driver[{Id}] to Organization[{Id}]",
                newApplicationId, driverId, orgId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating application for Driver[{Id}] to Organization[{Id}]", driverId, orgId);
            return false;
        }
    }

    public async Task<List<DriverApplication>?> GetAllDriverApplications()
    {
        _logger.LogInformation("Get all driver applications");
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText = $"SELECT {DriverApplicationsTable.GenerateSelect()}";

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            List<DriverApplication> applications = [];
            while (await reader.ReadAsync())
            {
                applications.Add(await GetDriverApplicationFromReader(reader));
            }

            _logger.LogInformation("Found {Count} applications", applications.Count);
            return applications;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting applications");
            return null;
        }
    }

    public async Task<List<DriverApplication>?> GetDriverApplicationsByDriver(int driverId)
    {
        throw new NotImplementedException();
    }

    public async Task<List<DriverApplication>?> GetDriverApplicationsByOrg(int orgId)
    {
        throw new NotImplementedException();
    }

    public async Task<bool> UpdateApplicationStatus(int applicationId, string newStatus, string reason, int editorUserId)
    {
        throw new NotImplementedException();
    }

    private async Task<DriverApplication> GetDriverApplicationFromReader(DbDataReader reader, string? readPrefix = null)
    {
        string pfx = readPrefix ?? "";


        int applicationId = reader.GetInt32(ApplicationIdField.Name);
        int driverId = reader.GetInt32(DriverIdField.Name);
        int orgId = reader.GetInt32(OrgIdField.Name);
        string applicationStatus = reader.GetString(ApplicationStatusField.Name);

        DateTime createdAtUtc = reader.GetDateTime(ApplicationCreatedAtUtcField.Name);
        DateTime lastModifiedUtc = reader.GetDateTime(ApplicationLastModifiedUtcField.Name);

        string driverMessage = reader.GetString(ApplicationDriverMessageField.Name);

        string? changeReason = reader[ApplicationChangeReasonField.Name].ToString();
        string? sponsorIdBeforeParse = reader[SponsorIdField.Name].ToString();

        if (string.IsNullOrWhiteSpace(changeReason))
        {
            changeReason = null;
        }

        int? sponsorId = null;
        if (int.TryParse(sponsorIdBeforeParse, out int parsedSponsorId))
        {
            sponsorId = parsedSponsorId;
        }


        return new DriverApplication
        {
            ApplicationId = applicationId,
            DriverId = driverId,
            OrgId = orgId,
            SponsorId = sponsorId,
            Status = applicationStatus,
            DriverMessage = driverMessage,
            ChangeReason = changeReason,
            CreatedAtUtc = createdAtUtc,
            LastModifiedUtc = lastModifiedUtc,
        };
    }
}
