using MySql.Data.MySqlClient;
using static Class4910Api.ConstantValues;

namespace Class4910Api.Configuration.Database;

public static class SeedDatabaseMethods
{
    public static bool SeedDatabase(string connectionString)
    {
        try
        {
            using MySqlConnection conn = new(connectionString);
            conn.Open();

            CreateTables(conn);
            CheckTables(conn);

            return true;
        }
        catch (Exception ex)
        {
            throw new($"Failed to Seed Database. Error: {ex.Message}", ex);
        }
    }

    private static void CreateTables(MySqlConnection conn)
    {
        using MySqlCommand command = conn.CreateCommand();

        try
        {
            // Orgs Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS Orgs (
	            {OrgIdField.SelectName} int AUTO_INCREMENT,

	            {OrgNameField.SelectName} varchar(100) NOT NULL,
	            {OrgPointWorthField.SelectName} decimal(4,2) NOT NULL DEFAULT 0.01,

	            {OrgCreatedAtUtcField.SelectName} DATETIME(6) NOT NULL,

	            CONSTRAINT Org_PK Primary Key ({OrgIdField.SelectName})
            )
            ";
            command.ExecuteNonQuery();

            // Users Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS Users (
	            {UserIdField.SelectName} int AUTO_INCREMENT,

	            {UserUserNameField.SelectName} varchar(200) NOT NULL,
                {UserEmailField.SelectName} varchar(500) NULL,
	            {UserHashedPasswordField.SelectName} TEXT NOT NULL,

	            {UserCreatedAtUtcField.SelectName} DATETIME(6) NOT NULL,

	            CONSTRAINT Users_PK PRIMARY KEY({UserIdField.SelectName}),
	            CONSTRAINT Users_UniqueUserName UNIQUE({UserUserNameField.SelectName}),
                CONSTRAINT Users_UniqueEmail UNIQUE({UserEmailField.SelectName})
            )
            ";
            command.ExecuteNonQuery();

            // Admins Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS Admins (
	            {AdminIdField.SelectName} int AUTO_INCREMENT,
	            {UserIdField.SelectName} int NOT NULL,

	            CONSTRAINT Admins_PK Primary Key ({AdminIdField.SelectName}),
	            CONSTRAINT Admins_Users_FK FOREIGN KEY ({UserIdField.SelectName}) REFERENCES Users({UserIdField.SelectName})
            )
            ";
            command.ExecuteNonQuery();

            // Drivers Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS Drivers (
	            {DriverIdField.SelectName} int AUTO_INCREMENT,
	            {UserIdField.SelectName} int NOT NULL,
	            {OrgIdField.SelectName} int NULL,

	            {DriverPointsField.SelectName} int DEFAULT 0 NOT NULL,
	            {DriverNotifyPointsChangedField.SelectName} BOOLEAN DEFAULT 1 NOT NULL,
	            {DriverNotifyOrdersAddedField.SelectName} BOOLEAN DEFAULT 1 NOT NULL,
	            {DriverStatusField.SelectName} varchar(50) DEFAULT '' NOT NULL,

	            CONSTRAINT Drivers_PK Primary Key ({DriverIdField.SelectName}),
	            CONSTRAINT Drivers_Users_FK FOREIGN KEY ({UserIdField.SelectName}) REFERENCES Users({UserIdField.SelectName}),
	            CONSTRAINT Drivers_Orgs_FK FOREIGN KEY ({OrgIdField.SelectName}) REFERENCES Orgs({OrgIdField.SelectName})
            )
            ";
            command.ExecuteNonQuery();

            // Sponsors Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS Sponsors (
	            {SponsorIdField.SelectName} int AUTO_INCREMENT,
	            {UserIdField.SelectName} int NOT NULL,
	            {OrgIdField.SelectName} int NOT NULL,


	            CONSTRAINT Sponsors_PK Primary Key ({SponsorIdField.SelectName}),
	            CONSTRAINT Sponsors_Users_FK FOREIGN KEY ({UserIdField.SelectName}) REFERENCES Users({UserIdField.SelectName}),
	            CONSTRAINT Sponsors_Organizations_FK FOREIGN KEY ({OrgIdField.SelectName}) REFERENCES Orgs({OrgIdField.SelectName})
            )
            ";
            command.ExecuteNonQuery();

            // DriverPointHistory Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS DriverPointHistory (
	            {PointHistoryIdField.SelectName} int AUTO_INCREMENT,
	            {DriverIdField.SelectName} int NOT NULL,
	            {SponsorIdField.SelectName} int NOT NULL,

	            {PointHistoryReasonField.SelectName} TEXT NOT NULL,
	            {PointHistoryDeltaField.SelectName} int NOT NULL,
	            {PointHistoryCreatedAtUtcField.SelectName} DATETIME(6) NOT NULL, 
	
	            CONSTRAINT DriverPointHistory_PK Primary Key ({PointHistoryIdField.SelectName}),
	            CONSTRAINT DriverPointHistory_Drivers_FK FOREIGN KEY ({DriverIdField.SelectName}) REFERENCES Drivers({DriverIdField.SelectName}),
	            CONSTRAINT DriverPointHistory_Sponsors_FK FOREIGN KEY ({SponsorIdField.SelectName}) REFERENCES Sponsors({SponsorIdField.SelectName})
            )
            ";
            command.ExecuteNonQuery();

            // Notifications Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS Notifications (
	            {NotificationIdField.SelectName} int AUTO_INCREMENT,
	            {UserIdField.SelectName} int NOT NULL,

	            {NotificationSeenField.SelectName} BOOLEAN DEFAULT 0 NOT NULL,
	            {NotificationMessageField.SelectName} TEXT NULL,
	            {NotificationTypeField.SelectName} varchar(50) NOT NULL,

	            CONSTRAINT Notifications_PK Primary Key ({NotificationIdField.SelectName}),
	            CONSTRAINT Notifications_Users_FK FOREIGN KEY ({UserIdField.SelectName}) REFERENCES Users({UserIdField.SelectName})
            )
            ";
            command.ExecuteNonQuery();

            // DriverApplications Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS DriverApplications (
	            {ApplicationIdField.SelectName} int AUTO_INCREMENT,
	            {SponsorIdField.SelectName} int NULL,
	            {DriverIdField.SelectName} int NOT NULL,
	            {OrgIdField.SelectName} int NOT NULL,

	            {ApplicationStatusField.SelectName} varchar(50) DEFAULT 'Waiting' NOT NULL,
	            {ApplicationReasonField.SelectName} TEXT NULL,

	            {ApplicationCreatedAtUtcField.SelectName} DATETIME(6) NOT NULL,
	            {ApplicationLastModifiedUtcField.SelectName} DATETIME(6) NOT NULL,


	            CONSTRAINT DriverApplications_CheckStatusInList CHECK({ApplicationStatusField.SelectName} IN ('Waiting', 'Approved', 'Rejected')),
	            CONSTRAINT DriverApplications_PK Primary Key ({ApplicationIdField.SelectName}), 
	            CONSTRAINT DriverApplications_Sponsors_FK FOREIGN KEY ({SponsorIdField.SelectName}) REFERENCES Sponsors({SponsorIdField.SelectName}),
	            CONSTRAINT DriverApplications_Drivers_FK FOREIGN KEY ({DriverIdField.SelectName}) REFERENCES Drivers({DriverIdField.SelectName}),
	            CONSTRAINT DriverApplications_Orgs_FK FOREIGN KEY ({OrgIdField.SelectName}) REFERENCES Orgs({OrgIdField.SelectName})
	            -- TODO: Add trigger for inserts
	            -- TODO: Add trigger for updates
            )
            ";
            command.ExecuteNonQuery();

            // PasswordChanges Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS PasswordChanges (
	            {PasswordChangeIdField.SelectName} int AUTO_INCREMENT,
	            {UserIdField.SelectName} int NOT NULL,

	            {PasswordChangeDateUtcField.SelectName} DATETIME(6) NOT NULL,

	            CONSTRAINT PasswordChanges_PK Primary Key ({PasswordChangeIdField.SelectName}), 
	            CONSTRAINT PasswordChanges_Users_FK FOREIGN KEY ({UserIdField.SelectName}) REFERENCES Users({UserIdField.SelectName})
            )
            ";
            command.ExecuteNonQuery();

            // LoginAttempts Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS LoginAttempts (
	            {LoginAttemptIdField.SelectName} int AUTO_INCREMENT,

	            {LoginAttemptUserNameField.SelectName} varchar(200) NOT NULL,
	            {LoginAttemptDateField.SelectName} DATETIME(6) NOT NULL,
	            {LoginAttemptStatusField.SelectName} varchar(50) NOT NULL,
                {LoginAttemptIpField.SelectName} varchar(100) NOT NULL,

	            CONSTRAINT LoginAttempts_PK Primary Key ({LoginAttemptIdField.SelectName}), 
	            CONSTRAINT LoginAttempts_CheckStatusValid CHECK({LoginAttemptStatusField.SelectName} IN ('Failure', 'Success'))
            )
            ";
            command.ExecuteNonQuery();

            // SqlLogging Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS SqlLogging (
	            {SqlLogIdField.SelectName} int AUTO_INCREMENT,

	            {SqlLogMessageField.SelectName} TEXT NULL,
	            {SqlLogSourceField.SelectName} varchar(100) NOT NULL,
	            {SqlLogTypeField.SelectName} varchar(50) NOT NULL,

	            CONSTRAINT SqlLogging_PK Primary Key ({SqlLogIdField.SelectName})
            )
            ";
            command.ExecuteNonQuery();

            // TeamInformation Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS {TeamInformationTable.Name} (
	            {TeamInfoNumberField.SelectName} int NOT NULL,
	            {TeamInfoVersionField.SelectName} varchar(100) NOT NULL,
	            {TeamInfoReleaseDateField.SelectName} DATETIME(6) NOT NULL,

	            {TeamInfoProductNameField.SelectName} varchar(100) NOT NULL,
                {TeamInfoProductDescriptionField.SelectName} varchar(500) NOT NULL
            )
            ";
            command.ExecuteNonQuery();

            // TeamMembers Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS {TeamMembersTable.Name} (
	            {TeamMemberNameField.SelectName} varchar(100) NOT NULL
            )
            ";
            command.ExecuteNonQuery();
        }
        catch (Exception ex)
        {
            throw new($"Failed to create tables. Error: {ex.Message}", ex);
        }
    }

    private static void CheckTables(MySqlConnection conn)
    {
        MySqlCommand command = conn.CreateCommand();
        foreach (DatabaseTable table in DatabaseTables)
        {
            command.CommandText = table.GenerateSelect();
            try
            {
                command.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                throw new($"Failed to query {table.Name}. Error: {ex.Message}", ex);
            }
        }
    }
}
