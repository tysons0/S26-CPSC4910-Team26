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
    private readonly ISponsorService _sponsorService;
    private readonly INotificationService _notificationService;
    private readonly IDriverService _driverService;

    public ApplicationService(ILogger<ApplicationService> logger,
                              ISponsorService sponsorService,
                              IDriverService driverService,
                              IOptions<DatabaseConnection> databaseConnection,
                              INotificationService notificationService)
    {
        _logger = logger;
        _dbConnection = databaseConnection.Value.Connection;
        _sponsorService = sponsorService;
        _notificationService = notificationService;
        _driverService = driverService;
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

    public async Task<bool> DeleteApplication(int applicationId)
    {
        _logger.LogInformation("Delete application[{Id}]", applicationId);

        try
        {

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"DELETE FROM {DriverApplicationsTable.Name}
                   WHERE {ApplicationIdField.SelectName} = @ApplicationId";

            command.Parameters.Add(ApplicationIdField.GenerateParameter("@ApplicationId", applicationId));

            int result = await command.ExecuteNonQueryAsync();

            if (result == 1)
            {
                _logger.LogInformation("Deleted application[{Id}]", applicationId);
            }
            else
            {
                _logger.LogWarning("Tried to delete application[{Id}] but no rows were affected", applicationId);
            }
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete application[{Id}]", applicationId);
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

            command.CommandText =
                @$"{DriverApplicationsTable.GenerateSelect()}";

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

    public async Task<DriverApplication?> GetApplication(int applicationId)
    {
        _logger.LogInformation("Get application[{Id}]", applicationId);
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"{DriverApplicationsTable.GenerateSelect()}
                   WHERE {ApplicationIdField.Name} = @ApplicationId";
            command.Parameters.Add(ApplicationIdField.GenerateParameter("@ApplicationId", applicationId));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                DriverApplication application = await GetDriverApplicationFromReader(reader);
                _logger.LogInformation("Found {Application} searching by [{Id}]", application, applicationId);
                return application;
            }
            else
            {
                _logger.LogWarning("Application[{Id}] not found.", applicationId);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting application[{Id}]", applicationId);
            return null;
        }
    }

    public async Task<List<DriverApplication>?> GetDriverApplicationsByDriver(int driverId)
    {
        _logger.LogInformation("Get driver[{Id}] applications", driverId);
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"{DriverApplicationsTable.GenerateSelect()}
                   WHERE {DriverIdField.Name} = @DriverId";
            command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", driverId));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            List<DriverApplication> applications = [];
            while (await reader.ReadAsync())
            {
                applications.Add(await GetDriverApplicationFromReader(reader));
            }

            _logger.LogInformation("Found {Count} applications for driver[{Id}]",
                applications.Count, driverId);
            return applications;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting applications for driver[{Id}]", driverId);
            return null;
        }
    }

    public async Task<List<DriverApplication>?> GetDriverApplicationsByOrg(int orgId)
    {
        _logger.LogInformation("Get Org[{Id}] applications", orgId);
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"{DriverApplicationsTable.GenerateSelect()}
                   WHERE {OrgIdField.Name} = @OrgId";
            command.Parameters.Add(OrgIdField.GenerateParameter("@OrgId", orgId));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            List<DriverApplication> applications = [];
            while (await reader.ReadAsync())
            {
                applications.Add(await GetDriverApplicationFromReader(reader));
            }

            _logger.LogInformation("Found {Count} applications for Org[{Id}]",
                applications.Count, orgId);
            return applications;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting applications for org[{Id}]", orgId);
            return null;
        }
    }

    public async Task<bool> UpdateApplicationStatus(int applicationId, string newStatus, string reason, int editorUserId)
    {
        _logger.LogInformation("Update application[{Id}] status to [{Status}] made by User[{EditorId}]",
            applicationId, newStatus, editorUserId);

        try
        {
            // Get Sponsor if they exist
            int? sponsorId = null;
            Sponsor? sponsor = await _sponsorService.GetSponsorByUserId(editorUserId);
            if (sponsor is not null)
            {
                _logger.LogInformation("[{Sponsor}] is updating application[{Id}] to status[{NewStatus}]",
                    sponsor, applicationId, newStatus);
                sponsorId = sponsor.SponsorId;
            }

            bool approve = false;
            if (newStatus.Contains("Accept", StringComparison.OrdinalIgnoreCase))
            {
                approve = true;
                newStatus = "Accepted";
            }
            if (newStatus.Contains("Reject", StringComparison.OrdinalIgnoreCase))
            {
                newStatus = "Rejected";
            }

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"UPDATE {DriverApplicationsTable.Name}
                   SET {ApplicationStatusField.SelectName} = @NewStatus, 
                       {SponsorIdField.SelectName} = @SponsorId,
                       {ApplicationChangeReasonField.SelectName} = @Reason, {ApplicationLastModifiedUtcField.SelectName} = UTC_TIMESTAMP()
                   WHERE {ApplicationIdField.SelectName} = @ApplicationId";

            command.Parameters.Add(ApplicationStatusField.GenerateParameter("@NewStatus", newStatus));
            command.Parameters.Add(ApplicationChangeReasonField.GenerateParameter("@Reason", reason));
            command.Parameters.Add(ApplicationIdField.GenerateParameter("@ApplicationId", applicationId));
            command.Parameters.Add(SponsorIdField.GenerateParameter("@SponsorId", sponsorId));

            int result = await command.ExecuteNonQueryAsync();

            if (result == 1)
            {
                DriverApplication application = await GetApplication(applicationId)
                        ?? throw new("Failed to retrieve application to update");
                // Update driver organization if approved
                if (approve)
                {
                    command.Parameters.Clear();
                    command.CommandText =
                    @$"UPDATE {DriversTable.Name} 
                       SET {OrgIdField.SelectName} = @OrgId, {DriverPointsField.SelectName} = 0
                       WHERE {DriverIdField.SelectName} = @Driverid";

                    command.Parameters.Add(OrgIdField.GenerateParameter("@OrgId", application.OrgId));
                    command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", application.DriverId));

                    _logger.LogInformation("Put Driver[{DriverId}] in Organization[{OrgId}]",
                        application.DriverId, application.OrgId);

                    await command.ExecuteNonQueryAsync();
                }

                // Send notification to driver about application status update
                Driver driver = await _driverService.GetDriverByDriverId(application.DriverId)
                    ?? throw new("Failed to retrieve driver to send notification");
                await _notificationService.CreateNotification(
                    userId: driver.UserData.Id,
                    $"Your application to Org[{application.OrgId}] has been updated to status[{newStatus}]. Reason: {reason}",
                    NotificationType.ApplicationStatusChange);

                _logger.LogInformation("Updated application[{Id}] to status[{NewStatus}]", applicationId, newStatus);
            }
            else
            {
                _logger.LogWarning("Tried to update application[{Id}] to status[{NewStatus}] but no rows were affected",
                    applicationId, newStatus);
            }
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update application[{Id}] to status[{NewStatus}]", applicationId, newStatus);
            return false;
        }
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
