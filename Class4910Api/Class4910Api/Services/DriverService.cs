using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;
using System.Data;
using System.Data.Common;
using System.IO.Pipelines;
using static Class4910Api.ConstantValues;
using static System.Net.Mime.MediaTypeNames;

namespace Class4910Api.Services;

public class DriverService : IDriverService
{
    private readonly ILogger<DriverService> _logger;
    private readonly string _dbConnection;
    private readonly IUserService _userService;
    private readonly INotificationService _notificationService;
    private readonly IOrganizationService _organizationService;
    public DriverService(ILogger<DriverService> logger, 
                         IOptions<DatabaseConnection> databaseConnection,
                         INotificationService notificationService,
                         IUserService userService,
                         IOrganizationService organizationService)
    {
        _logger = logger;
        _dbConnection = databaseConnection.Value.Connection;
        _userService = userService;
        _notificationService = notificationService;
        _organizationService = organizationService;
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

    public async Task<List<Driver>?> GetAllDrivers()
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
                ";

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            List<Driver> driverList = [];
            while (await reader.ReadAsync())
            {
                Driver driverFromUserId = await GetDriverFromReader(reader, userAlias, driverAlias);
                driverList.Add(driverFromUserId);
            }

            _logger.LogInformation("Retrieved {Count} drivers", driverList.Count);
            return driverList;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving All Drivers");
            return null;
        }
    }

    public async Task<List<Driver>?> GetDriversByOrgId(int orgId)
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
                   JOIN {OrgDriverMappingTable.Name} orgDriver ON orgDriver.{MappingDriverIdField.SelectName} = {driverAlias}.{DriverIdField.SelectName}
                   WHERE orgDriver.{MappingOrgIdField.SelectName} = @OrgId";
            command.Parameters.Add(MappingOrgIdField.GenerateParameter("@OrgId", orgId));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            List<Driver> driverList = [];
            while (await reader.ReadAsync())
            {
                Driver driverFromUserId = await GetDriverFromReader(reader, userAlias, driverAlias);
                driverList.Add(driverFromUserId);
            }

            _logger.LogInformation("Retrieved {Count} drivers for Org[{Id}]", driverList.Count, orgId);
            return driverList;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Driver using orgId[{Id}]", orgId);
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

        bool notifyForPointsChanged = reader.GetBoolean($"{pfx}{DriverNotifyPointsChangedField.Name}");

        List<DriverAddress> addresses = await GetDriverAddresses(driverId) ?? [];

        User userData = await _userService.GetUserFromReader(reader, userReadPrefix);

        List<DriverOrgRelationship>? driverOrgsAndPoints = await GetDriverOrgAndPoints(driverId);


        return new Driver()
        {
            DriverId = driverId,
            DriverOrgsAndPoints = driverOrgsAndPoints ?? [],
            UserData = userData.ToReadFormat(),
            NotifyForPointsChanged = notifyForPointsChanged,
            Addresses = addresses
        };
    }

    private async Task<DriverAddress> GetDriverAddressFromReader(DbDataReader reader)
    {

        int driverId = reader.GetInt32(DriverIdField.Name);
        int addressId = reader.GetInt32(DriverAddressIdField.Name);

        string city = reader.GetString(DriverAddressCityField.Name);
        string state = reader.GetString(DriverAddressStateField.Name);
        string zipCode = reader.GetString(DriverAddressZipCodeField.Name);

        string addressAlias = reader.GetString(DriverAddressAliasField.Name);
        string addressLine1 = reader.GetString(DriverAddressLine1Field.Name);
        string addressLine2 = reader.GetString(DriverAddressLine2Field.Name);

        bool primary = reader.GetBoolean(DriverAddressPrimaryField.Name);

        return new DriverAddress()
        {
            AddressId = addressId,
            DriverId = driverId,
            City = city,
            State = state,
            ZipCode = zipCode,
            AddressAlias = addressAlias,
            AddressLine1 = addressLine1,
            AddressLine2 = addressLine2,
            Primary = primary
        };
    }

    private async Task<List<DriverOrgRelationship>?> GetDriverOrgAndPoints(int driverId)
    {
        string mappingPfx = "orgDriverMapping";
        string orgPfx = "org";
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            await conn.OpenAsync();

            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT {OrgDriverMappingTable.GetFields(mappingPfx)} , {OrgsTable.GetFields(orgPfx)}
                   FROM {OrgDriverMappingTable.Name} {mappingPfx}
                   JOIN {OrgsTable.Name} {orgPfx} ON {orgPfx}.{OrgIdField.SelectName} = {mappingPfx}.{MappingOrgIdField.SelectName}
                   WHERE {MappingDriverIdField.SelectName} = @DriverId";

            command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", driverId));

            List<DriverOrgRelationship> driverOrgsAndPoints = [];
            await using DbDataReader reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync()) 
            {
                int orgId = reader.GetInt32($"{mappingPfx}_{MappingOrgIdField.Name}");
                int points = reader.GetInt32($"{mappingPfx}_{MappingDriverPointsField.Name}");
                Organization? org = await _organizationService.GetOrganizationFromReader(reader, orgPfx);
                if (org == null)
                {
                    _logger.LogWarning("Could not find Org with id[{OrgId}] for driver[{DriverId}] when retrieving org and points", orgId, driverId);
                    continue;
                }
                driverOrgsAndPoints.Add(new DriverOrgRelationship { OrgId = orgId, Points = points });
            }
            return driverOrgsAndPoints;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving org and points for driver[{Id}]", driverId);
            return null;
        }
    }

    public async Task<PointHistoryRecord> GetPointHistoryRecordFromReader(DbDataReader reader, string? prefix = null)
    {
        try
        {
            string pfx = prefix ?? "";
            if (!string.IsNullOrWhiteSpace(pfx))
                pfx += "_";

            int driverId = reader.GetInt32($"{pfx}{DriverIdField.Name}");

            string sponsorIdStr = reader[$"{pfx}{SponsorIdField.Name}"].ToString() ?? "";
            int? sponsorId;
            if (string.IsNullOrWhiteSpace(sponsorIdStr))
                sponsorId = null;
            else
                sponsorId = reader.GetInt32($"{pfx}{SponsorIdField.Name}");

            int pointChange = reader.GetInt32($"{pfx}{PointHistoryDeltaField.Name}");
            string reason = reader.GetString($"{pfx}{PointHistoryReasonField.Name}");
            DateTime createdAtUtc = reader.GetDateTime($"{pfx}{PointHistoryCreatedAtUtcField.Name}");

            return new PointHistoryRecord()
            {
                DriverId = driverId,
                SponsorId = sponsorId,
                PointChange = pointChange,
                Reason = reason,
                CreatedAtUtc = createdAtUtc,
            };
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "Error parsing PointHistoryRecord from reader with prefix[{Prefix}]", prefix);
            throw;
        }
    }

    public async Task<List<DriverAddress>?> GetDriverAddresses(int driverId)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT {DriverAddressesTable.GetFields()}
                   FROM {DriverAddressesTable.Name}
                   WHERE {DriverIdField.SelectName} = @DriverId";
            command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", driverId));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            List<DriverAddress> addresses = [];
            while (await reader.ReadAsync())
            {
                addresses.Add(await GetDriverAddressFromReader(reader));
            }

            _logger.LogInformation("Found {Count} address for driver[{Id}]", addresses.Count, driverId);
            return addresses;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Driver addresses for driver[{Id}]", driverId);
            return null;
        }
    }

    public async Task<DriverAddress?> GetDriverAddressById(int driverId, int addressId)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();
            command.CommandText =
                @$"SELECT {DriverAddressesTable.GetFields()}
                   FROM {DriverAddressesTable.Name}
                   WHERE {DriverIdField.SelectName} = @DriverId AND
                         {DriverAddressIdField.SelectName} = @AddressId";
            command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", driverId));
            command.Parameters.Add(DriverAddressIdField.GenerateParameter("@AddressId", addressId));
            await using DbDataReader reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                DriverAddress address = await GetDriverAddressFromReader(reader);
                _logger.LogInformation("Retrieved Address[{Address}] for driver[{Id}]", address, driverId);
                return address;
            }
            else
            {
                _logger.LogInformation("No Address found with id[{AddressId}] for driver[{Id}]", addressId, driverId);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Driver address with id[{AddressId}] for driver[{Id}]", addressId, driverId);
            return null;
        }
    }

    public async Task<bool> AddDriverAddress(int driverId, AddressRequest req)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"INSERT INTO {DriverAddressesTable.Name}
                   ({DriverIdField.SelectName}, {DriverAddressAliasField.SelectName}, 
                    {DriverAddressStateField.SelectName}, {DriverAddressCityField.SelectName}, {DriverAddressZipCodeField.SelectName},
                    {DriverAddressLine1Field.SelectName}, {DriverAddressLine2Field.SelectName}, {DriverAddressPrimaryField.SelectName})
                   VALUES
                   (@DriverId, @Alias,
                    @State, @City, @ZipCode,
                    @Line1, @Line2, @Primary)";
            command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", driverId));
            command.Parameters.Add(DriverAddressAliasField.GenerateParameter("@Alias", req.AddressAlias));
            command.Parameters.Add(DriverAddressStateField.GenerateParameter("@State", req.State));
            command.Parameters.Add(DriverAddressCityField.GenerateParameter("@City", req.City));
            command.Parameters.Add(DriverAddressZipCodeField.GenerateParameter("@ZipCode", req.ZipCode));
            command.Parameters.Add(DriverAddressLine1Field.GenerateParameter("@Line1", req.AddressLine1));
            command.Parameters.Add(DriverAddressLine2Field.GenerateParameter("@Line2", req.AddressLine2));
            command.Parameters.Add(DriverAddressPrimaryField.GenerateParameter("@Primary", req.Primary));

            await command.ExecuteNonQueryAsync();

            _logger.LogInformation("Created Address [{Request}] for Driver[{Id}]", req, driverId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding Driver address for driver[{Id}]", driverId);
            return false;
        }
    }

    public async Task<bool> SetPrimaryAddress(int driverId, int addressId)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"UPDATE {DriverAddressesTable.Name}
                   SET {DriverAddressPrimaryField.SelectName} = 1
                   WHERE {DriverIdField.SelectName} = @DriverId AND
                   {DriverAddressIdField.SelectName} = @AddressId
                ";
            command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", driverId));
            command.Parameters.Add(DriverAddressIdField.GenerateParameter("@AddressId", addressId));

            await command.ExecuteNonQueryAsync();

            _logger.LogInformation("Updated Address[{Id}] for Driver[{Id}] to primary", addressId, driverId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Address[{Id}] for Driver[{Id}] to primary", addressId, driverId);
            return false;
        }
    }

    public async Task<bool> UpdateAddress(int driverId, int addressId, AddressRequest req)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"UPDATE {DriverAddressesTable.Name}
                   SET {DriverAddressCityField.SelectName} = @City,
                       {DriverAddressZipCodeField.SelectName} = @ZipCode,
                       {DriverAddressStateField.SelectName} = @State,
                       {DriverAddressLine1Field.SelectName} = @Line1,
                       {DriverAddressLine2Field.SelectName} = @Line2,
                       {DriverAddressAliasField.SelectName} = @Alias,
                       {DriverAddressPrimaryField.SelectName} = @Primary
                   WHERE {DriverIdField.SelectName} = @DriverId AND
                   {DriverAddressIdField.SelectName} = @AddressId
                ";

            command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", driverId));
            command.Parameters.Add(DriverAddressIdField.GenerateParameter("@AddressId", addressId));

            command.Parameters.Add(DriverAddressCityField.GenerateParameter("@City", req.City));
            command.Parameters.Add(DriverAddressZipCodeField.GenerateParameter("@ZipCode", req.ZipCode));
            command.Parameters.Add(DriverAddressStateField.GenerateParameter("@State", req.State));
            command.Parameters.Add(DriverAddressLine1Field.GenerateParameter("@Line1", req.AddressLine1));
            command.Parameters.Add(DriverAddressLine2Field.GenerateParameter("@Line2", req.AddressLine2));
            command.Parameters.Add(DriverAddressAliasField.GenerateParameter("@Alias", req.AddressAlias));
            command.Parameters.Add(DriverAddressPrimaryField.GenerateParameter("@Primary", req.Primary));


            await command.ExecuteNonQueryAsync();

            _logger.LogInformation("Updated Address[{Id}] for Driver[{Id}].", addressId, driverId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Address[{Id}] for Driver[{Id}] to [{Request}]", addressId, driverId, req);
            return false;
        }
    }

    public async Task<bool> DeleteDriverAddress(int driverId, int addressId)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"DELETE FROM {DriverAddressesTable.Name}
                   WHERE {DriverIdField.SelectName} = @DriverId AND
                   {DriverAddressIdField.SelectName} = @AddressId
                ";
            command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", driverId));
            command.Parameters.Add(DriverAddressIdField.GenerateParameter("@AddressId", addressId));

            await command.ExecuteNonQueryAsync();

            _logger.LogInformation("Deleted Address[{Id}] for Driver[{Id}]", addressId, driverId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Address[{Id}] for Driver[{Id}]", addressId, driverId);
            return false;
        }
    }

    public async Task<bool> ChangePointAlertPreference(int driverId, bool enabled)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"UPDATE {DriversTable.Name}
                   SET {DriverNotifyPointsChangedField.SelectName} = @Enabled
                   WHERE {DriverIdField.SelectName} = @DriverId";
            command.Parameters.Add(DriverNotifyPointsChangedField.GenerateParameter("@Enabled", enabled));
            command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", driverId));

            int rowsUpdated = await command.ExecuteNonQueryAsync();
            bool updated = rowsUpdated > 0;

            _logger.LogInformation("Updated NotifyForPointsChanged[{Enabled}] for Driver[{DriverId}] changedRows[{Rows}]",
                enabled, driverId, rowsUpdated);

            return updated;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating NotifyForPointsChanged[{Enabled}] for Driver[{DriverId}]",
                enabled, driverId);
            return false;
        }
    }

    public async Task<bool> AddToDriverPointHistory(int driverId, int? sponsorId, PointChangeRequest pointChangeRequest)
    {
        try
        {
            Driver driver = await GetDriverByDriverId(driverId)
                ?? throw new($"Could not find driver");

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"INSERT INTO {DriverPointHistoryTable.Name}
                   ({DriverIdField.SelectName}, {SponsorIdField.SelectName}, {OrgIdField.SelectName},
                    {PointHistoryReasonField.SelectName}, {PointHistoryDeltaField.SelectName}, {PointHistoryCreatedAtUtcField.SelectName})
                   VALUES
                   (@DriverId, @SponsorId, @OrgId, @Reason, @PointChange, @UtcNow)";
            command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", driverId));
            command.Parameters.Add(SponsorIdField.GenerateParameter("@SponsorId", sponsorId));
            command.Parameters.Add(OrgIdField.GenerateParameter("@OrgId", pointChangeRequest.OrgId));
            command.Parameters.Add(PointHistoryReasonField.GenerateParameter("@Reason", pointChangeRequest.ChangeReason));
            command.Parameters.Add(PointHistoryDeltaField.GenerateParameter("@PointChange", pointChangeRequest.PointChange));
            command.Parameters.Add(PointHistoryCreatedAtUtcField.GenerateParameter("@UtcNow", DateTime.UtcNow));

            await command.ExecuteNonQueryAsync();

            _logger.LogInformation("Created PointHistory Entry for Driver[{Id}]. PointChange[{Change}]",
                driverId, pointChangeRequest.PointChange);

            await _notificationService.CreateNotification(
                driver.UserData.Id,
                $"Your points have been updated by {pointChangeRequest.PointChange} points for the following reason: {pointChangeRequest.ChangeReason}",
                NotificationType.PointsChange,
                driver
            );

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating PointHistory Entry for Driver[{Id}]. PointChange[{Change}]",
                driverId, pointChangeRequest.PointChange);
            return false;
        }
    }

    public async Task<List<PointHistoryRecord>?> GetDriverPointHistory(int driverId)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT {DriverPointHistoryTable.GetFields()}
                   FROM {DriverPointHistoryTable.Name}
                   WHERE {DriverIdField.SelectName} = @DriverId";
            command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", driverId));

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            List<PointHistoryRecord> historyRecords = [];
            while (await reader.ReadAsync())
            {
                historyRecords.Add(await GetPointHistoryRecordFromReader(reader));
            }

            _logger.LogInformation("Found {Count} point history records for driver[{Id}]", historyRecords.Count, driverId);
            return historyRecords;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Driver point history records for driver[{Id}]", driverId);
            return null;
        }
    }

    public async Task AddDriverToOrg(int driverId, int orgId)
    {
        try
        {
            await using MySqlConnection connection = new(_dbConnection);
            await connection.OpenAsync();

            MySqlCommand command = connection.CreateCommand();

            command.CommandText =
            @$"INSERT INTO {OrgDriverMappingTable.Name} 
            ({MappingOrgIdField.SelectName}, {MappingDriverIdField.SelectName}, {MappingDriverPointsField.SelectName}, {MappingCreatedAtUtcField.SelectName})
            VALUES (@OrgId, @DriverId, 0, UTC_TIMESTAMP())";

            command.Parameters.Add(OrgIdField.GenerateParameter("@OrgId", orgId));
            command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", driverId));

            _logger.LogInformation("Put Driver[{DriverId}] in Organization[{OrgId}]",
                driverId, orgId);

            await command.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding driver[{DriverId}] to Org[{OrgId}]", driverId, orgId);
            throw;
        }
    }
}
