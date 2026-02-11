namespace Class4910Api;

using System.Data;
using Class4910Api.Configuration.Database;
using Class4910Api.Models;
using MySql.Data.MySqlClient;

public static class ConstantValues
{
    private const StringComparison IgnoreCase = StringComparison.OrdinalIgnoreCase;

    #region Database

    #region Orgs

    public static readonly DatabaseField OrgIdField =
        new() { Name = "OrgId", Type = MySqlDbType.Int32, Nullable = false };

    public static readonly DatabaseField OrgNameField =
        new() { Name = "Name", Type = MySqlDbType.String, Nullable = false };

    public static readonly DatabaseField OrgPointWorthField =
        new() { Name = "PointWorth", Type = MySqlDbType.Decimal, Nullable = false };

    public static readonly DatabaseField OrgCreatedAtUtcField =
        new() { Name = "CreatedAtUtc", Type = MySqlDbType.DateTime, Nullable = false };

    public static readonly DatabaseTable OrgsTable = new()
    {
        Name = "Orgs",
        Fields = [OrgIdField, OrgNameField, OrgPointWorthField, OrgCreatedAtUtcField]
    };

    #endregion

    #region Users

    public static readonly DatabaseField UserIdField =
        new() { Name = "UserId", Type = MySqlDbType.Int32, Nullable = false };

    public static readonly DatabaseField UserUserNameField =
        new() { Name = "UserName", Type = MySqlDbType.String, Nullable = false };

    public static readonly DatabaseField UserEmailField =
        new() { Name = "Email", Type = MySqlDbType.String, Nullable = true };

    public static readonly DatabaseField UserHashedPasswordField =
        new() { Name = "HashedPassword", Type = MySqlDbType.String, Nullable = false };

    public static readonly DatabaseField UserCreatedAtUtcField =
        new() { Name = "CreatedAtUtc", Type = MySqlDbType.DateTime, Nullable = false };

    public static readonly DatabaseTable UsersTable = new()
    {
        Name = "Users",
        Fields =
        [
            UserIdField,
            UserUserNameField,
            UserEmailField,
            UserHashedPasswordField,
            UserCreatedAtUtcField
        ]
    };

    #endregion

    #region Admins

    public static readonly DatabaseField AdminIdField =
        new() { Name = "AdminId", Type = MySqlDbType.Int32, Nullable = false };

    public static readonly DatabaseTable AdminsTable = new()
    {
        Name = "Admins",
        Fields = [AdminIdField, UserIdField]
    };

    #endregion

    #region Drivers

    public static readonly DatabaseField DriverIdField =
        new() { Name = "DriverId", Type = MySqlDbType.Int32, Nullable = false };

    public static readonly DatabaseField DriverOrgIdField =
        new() { Name = "OrgId", Type = MySqlDbType.Int32, Nullable = true };

    public static readonly DatabaseField DriverPointsField =
        new() { Name = "Points", Type = MySqlDbType.Int32, Nullable = false };

    public static readonly DatabaseField DriverNotifyPointsChangedField =
        new() { Name = "NotifyForPointsChanged", Type = MySqlDbType.Bit, Nullable = false };

    public static readonly DatabaseField DriverNotifyOrdersAddedField =
        new() { Name = "NotifyForOrdersAdded", Type = MySqlDbType.Bit, Nullable = false };

    public static readonly DatabaseField DriverStatusField =
        new() { Name = "DriverStatus", Type = MySqlDbType.String, Nullable = false };

    public static readonly DatabaseTable DriversTable = new()
    {
        Name = "Drivers",
        Fields =
        [
            DriverIdField,
            UserIdField,
            DriverOrgIdField,
            DriverPointsField,
            DriverNotifyPointsChangedField,
            DriverNotifyOrdersAddedField,
            DriverStatusField
        ]
    };

    #endregion

    #region Sponsors

    public static readonly DatabaseField SponsorIdField =
        new() { Name = "SponsorId", Type = MySqlDbType.Int32, Nullable = false };

    public static readonly DatabaseTable SponsorsTable = new()
    {
        Name = "Sponsors",
        Fields = [SponsorIdField, UserIdField, OrgIdField]
    };

    #endregion

    #region DriverPointHistory

    public static readonly DatabaseField PointHistoryIdField =
        new() { Name = "PointHistoryId", Type = MySqlDbType.Int32, Nullable = false };

    public static readonly DatabaseField PointHistoryReasonField =
        new() { Name = "Reason", Type = MySqlDbType.String, Nullable = false };

    public static readonly DatabaseField PointHistoryDeltaField =
        new() { Name = "PointDelta", Type = MySqlDbType.Int32, Nullable = false };

    public static readonly DatabaseField PointHistoryCreatedAtUtcField =
        new() { Name = "CreatedAtUtc", Type = MySqlDbType.DateTime, Nullable = false };

    public static readonly DatabaseTable DriverPointHistoryTable = new()
    {
        Name = "DriverPointHistory",
        Fields =
        [
            PointHistoryIdField,
            DriverIdField,
            SponsorIdField,
            PointHistoryReasonField,
            PointHistoryDeltaField,
            PointHistoryCreatedAtUtcField
        ]
    };

    #endregion

    #region Notifications

    public static readonly DatabaseField NotificationIdField =
        new() { Name = "NotificationId", Type = MySqlDbType.Int32, Nullable = false };

    public static readonly DatabaseField NotificationSeenField =
        new() { Name = "NotificationSeen", Type = MySqlDbType.Bit, Nullable = false };

    public static readonly DatabaseField NotificationMessageField =
        new() { Name = "NotificationMessage", Type = MySqlDbType.String, Nullable = false };

    public static readonly DatabaseField NotificationTypeField =
        new() { Name = "NotificationType", Type = MySqlDbType.String, Nullable = false };

    public static readonly DatabaseTable NotificationsTable = new()
    {
        Name = "Notifications",
        Fields =
        [
            NotificationIdField,
            UserIdField,
            NotificationSeenField,
            NotificationMessageField,
            NotificationTypeField
        ]
    };

    #endregion

    #region DriverApplications

    public static readonly DatabaseField ApplicationIdField =
        new() { Name = "ApplicationId", Type = MySqlDbType.Int32, Nullable = false };

    public static readonly DatabaseField ApplicationStatusField =
        new() { Name = "ApplicationStatus", Type = MySqlDbType.String, Nullable = false };

    public static readonly DatabaseField ApplicationReasonField =
        new() { Name = "Reason", Type = MySqlDbType.String, Nullable = false };

    public static readonly DatabaseField ApplicationCreatedAtUtcField =
        new() { Name = "CreatedAtUtc", Type = MySqlDbType.DateTime, Nullable = false };

    public static readonly DatabaseField ApplicationLastModifiedUtcField =
        new() { Name = "LastModifiedUtc", Type = MySqlDbType.DateTime, Nullable = false };

    public static readonly DatabaseTable DriverApplicationsTable = new()
    {
        Name = "DriverApplications",
        Fields =
        [
            ApplicationIdField,
            SponsorIdField,
            DriverIdField,
            OrgIdField,
            ApplicationStatusField,
            ApplicationReasonField,
            ApplicationCreatedAtUtcField,
            ApplicationLastModifiedUtcField
        ]
    };

    #endregion

    #region PasswordChanges

    public static readonly DatabaseField PasswordChangeIdField =
        new() { Name = "PasswordChangeId", Type = MySqlDbType.Int32, Nullable = false };

    public static readonly DatabaseField PasswordChangeDateUtcField =
        new() { Name = "ChangeDateUtc", Type = MySqlDbType.DateTime, Nullable = false };

    public static readonly DatabaseTable PasswordChangesTable = new()
    {
        Name = "PasswordChanges",
        Fields = [PasswordChangeIdField, UserIdField, PasswordChangeDateUtcField]
    };

    #endregion

    #region LoginAttempts

    public static readonly DatabaseField LoginAttemptIdField =
        new() { Name = "LoginAttemptId", Type = MySqlDbType.Int32, Nullable = false };

    public static readonly DatabaseField LoginAttemptUserNameField =
        new() { Name = "UserName", Type = MySqlDbType.String, Nullable = false };

    public static readonly DatabaseField LoginAttemptDateField =
        new() { Name = "LoginDate", Type = MySqlDbType.DateTime, Nullable = false };

    public static readonly DatabaseField LoginAttemptStatusField =
        new() { Name = "LoginStatus", Type = MySqlDbType.String, Nullable = false };

    public static readonly DatabaseField LoginAttemptIpField =
        new() { Name = "LoginIP", Type = MySqlDbType.String, Nullable = false };

    public static readonly DatabaseTable LoginAttemptsTable = new()
    {
        Name = "LoginAttempts",
        Fields =
        [
            LoginAttemptIdField,
            LoginAttemptUserNameField,
            LoginAttemptDateField,
            LoginAttemptStatusField,
            LoginAttemptIpField
        ]
    };

    #endregion

    #region SqlLogging

    public static readonly DatabaseField SqlLogIdField =
        new() { Name = "LogId", Type = MySqlDbType.Int32, Nullable = false };

    public static readonly DatabaseField SqlLogMessageField =
        new() { Name = "LogMessage", Type = MySqlDbType.String, Nullable = true };

    public static readonly DatabaseField SqlLogSourceField =
        new() { Name = "LogSource", Type = MySqlDbType.String, Nullable = true };

    public static readonly DatabaseField SqlLogTypeField =
        new() { Name = "LogType", Type = MySqlDbType.String, Nullable = true };

    public static readonly DatabaseTable SqlLoggingTable = new()
    {
        Name = "SqlLogging",
        Fields =
        [
            SqlLogIdField,
            SqlLogMessageField,
            SqlLogSourceField,
            SqlLogTypeField
        ]
    };

    #endregion

    #region ApiLogging
    public static readonly DatabaseField ApiLog_Id =
        new() { Name = "id", Type = MySqlDbType.Int32, Nullable = false };

    public static readonly DatabaseField ApiLog_Ts =
        new() { Name = "_ts", Type = MySqlDbType.Timestamp, Nullable = true };

    public static readonly DatabaseField ApiLog_Exception =
        new() { Name = "Exception", Type = MySqlDbType.Text, Nullable = true };

    public static readonly DatabaseField ApiLog_Level =
        new() { Name = "Level", Type = MySqlDbType.VarChar, Nullable = true };

    public static readonly DatabaseField ApiLog_Message =
        new() { Name = "Message", Type = MySqlDbType.Text, Nullable = true };

    public static readonly DatabaseField ApiLog_Properties =
        new() { Name = "Properties", Type = MySqlDbType.Text, Nullable = true };

    public static readonly DatabaseField ApiLog_Template =
        new() { Name = "Template", Type = MySqlDbType.Text, Nullable = true };

    public static readonly DatabaseField ApiLog_Timestamp =
        new() { Name = "Timestamp", Type = MySqlDbType.VarChar, Nullable = true };

    public static readonly DatabaseTable ApiLoggingTable = new()
    {
        Name = "ApiLogging",
        Fields =
        [
            ApiLog_Id,
            ApiLog_Ts,
            ApiLog_Exception,
            ApiLog_Level,
            ApiLog_Message,
            ApiLog_Properties,
            ApiLog_Template,
            ApiLog_Timestamp
        ]
    };
    #endregion

    #region TeamInformation
    public static readonly DatabaseField TeamInfoNumberField =
        new() { Name = "TeamNumber", Type = MySqlDbType.Int32, Nullable = false };
    public static readonly DatabaseField TeamInfoVersionField =
        new() { Name = "Version", Type = MySqlDbType.String, Nullable = false };
    public static readonly DatabaseField TeamInfoReleaseDateField =
        new() { Name = "ReleaseDate", Type = MySqlDbType.DateTime, Nullable = false };
    public static readonly DatabaseField TeamInfoProductNameField =
        new() { Name = "ProductName", Type = MySqlDbType.String, Nullable = false };
    public static readonly DatabaseField TeamInfoProductDescriptionField =
        new() { Name = "ProductDescription", Type = MySqlDbType.String, Nullable = false };

    public static readonly DatabaseTable TeamInformationTable = new()
    {
        Name = "TeamInformation",
        Fields =
        [
            TeamInfoNumberField,
            TeamInfoVersionField,
            TeamInfoReleaseDateField,
            TeamInfoProductNameField,
            TeamInfoProductDescriptionField
        ]
    };
    #endregion

    #region TeamMembers
    public static readonly DatabaseField TeamMemberNameField =
        new() { Name = "MemberName", Type = MySqlDbType.String, Nullable = false };

    public static readonly DatabaseTable TeamMembersTable = new()
    {
        Name = "TeamMembers",
        Fields =
        [
            TeamMemberNameField
        ]
    };
    #endregion

    public static readonly List<DatabaseTable> DatabaseTables =
    [
        OrgsTable,
        UsersTable,
        AdminsTable,
        DriversTable,
        SponsorsTable,
        DriverPointHistoryTable,
        NotificationsTable,
        DriverApplicationsTable,
        PasswordChangesTable,
        LoginAttemptsTable,
        SqlLoggingTable,
        ApiLoggingTable
    ];

    #endregion

    public const string TeamName = "ByteMe";

    public const string ADMIN = nameof(UserRole.Admin);
    public const string DRIVER = nameof(UserRole.Driver);
    public const string SPONSOR = nameof(UserRole.Sponsor);
    public const string USER = nameof(UserRole.User);

    public const string userAlias = "user";
    public const string driverAlias = "driver";
    public const string orgAlias = "org";
    public const string sponsorAlias = "sponsor";
    public const string adminAlias = "admin";

    #region Seed Info

    public const string seedAdminUserName = "seedadmin";
    public const string seedAdminPassword = "seed-admin-pw123";

    public static readonly UserRequest seedAdminRequest = new()
    {
        UserName = seedAdminUserName,
        Password = seedAdminPassword
    };

    public const string seedDriverUserName = "seeddriver";
    public const string seedDriverPassword = "seed-driver-pw123";

    public static readonly UserRequest seedDriverRequest = new()
    {
        UserName = seedDriverUserName,
        Password = seedDriverPassword
    };

    public const string seedSponsorUserName = "seedsponsor";
    public const string seedSponsorPassword = "seed-sponsor-pw123";

    public static readonly UserRequest seedSponsorRequest = new()
    {
        UserName = seedSponsorUserName,
        Password = seedSponsorPassword
    };

    public const string seedOrgName = "Seed Org";
    #endregion
}
