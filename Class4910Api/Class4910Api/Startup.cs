using System.Text;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MySql.Data.MySqlClient;
using Scalar.AspNetCore;
using Serilog;

using static Class4910Api.ConstantValues;

namespace Class4910Api;

public static class Startup
{
    public const string corsPolicyName = "AllowAll";

    public static WebApplicationBuilder CreateBuilder(WebApplicationBuilder builder)
    {
        try
        {
            builder = AddServices(builder);
            builder = AddLifetimeServices(builder);

            builder = AddLogging(builder);

            return builder;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"An error occurred during startup: {ex.Message}");
            Log.Error(ex, "An error occurred during startup");
            throw;
        }
    }

    public static WebApplicationBuilder AddLogging(WebApplicationBuilder builder)
    {
        DatabaseConnection dbConnectionInfo =
                builder.Configuration.GetRequiredSection("DatabaseConnection").Get<DatabaseConnection>()!;

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .Enrich.FromLogContext()
            .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Error)
            .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Error)
            .WriteTo.Console()
            .WriteTo.MySQL(
                connectionString: dbConnectionInfo.Connection,
                tableName: ConstantValues.ApiLoggingTable.Name
            )
            .CreateLogger();

        Log.Information("Logger configured successfully");

        builder.Host.UseSerilog();
        return builder;
    }

    public static WebApplicationBuilder AddServices(WebApplicationBuilder builder)
    {
        //https://github.com/scalar/scalar/discussions/4468#discussioncomment-15371071
        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            //https://learn.microsoft.com/en-us/azure/container-apps/dotnet-overview#define-x-forwarded-headers
            options.ForwardedHeaders =
                ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });

        JwtSettings jwt = builder.Configuration.GetRequiredSection("JwtSettings").Get<JwtSettings>()!;

        builder.Services.AddControllers();
        builder.Services.AddOpenApi("v1", options => { options.AddDocumentTransformer<BearerSecuritySchemeTransformer>(); });

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new()
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwt.JwtKey)
                        ),
                    ClockSkew = TimeSpan.Zero
                };
            });

        builder.Services.AddCors(options =>
        {
            options.AddPolicy(corsPolicyName, policy =>
            {
                policy
                    .AllowAnyOrigin()
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        return builder;
    }

    public static WebApplicationBuilder AddLifetimeServices(WebApplicationBuilder builder)
    {
        builder.Services.Configure<JwtSettings>(builder.Configuration.GetRequiredSection("JwtSettings"));
        builder.Services.Configure<AppSettings>(builder.Configuration.GetRequiredSection("AppSettings"));
        builder.Services.Configure<DatabaseConnection>(builder.Configuration.GetRequiredSection("DatabaseConnection"));
        builder.Services.Configure<EbayConfig>(builder.Configuration.GetRequiredSection("EbayConfig"));

        builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

        builder.Services.AddScoped<IAuthService, AuthService>();
        builder.Services.AddScoped<IContextService, ContextService>();

        builder.Services.AddScoped<IUserService, UserService>();
        builder.Services.AddScoped<IAdminService, AdminService>();
        builder.Services.AddScoped<IDriverService, DriverService>();
        builder.Services.AddScoped<ISponsorService, SponsorService>();
        builder.Services.AddScoped<IOrganizationService, OrganizationService>();
        builder.Services.AddScoped<INotificationService, NotificationService>();

        builder.Services.AddHttpClient<IEbayService, EbayService>();

        return builder;
    }

    public static async Task<WebApplication> ConfigureApp(WebApplicationBuilder builder, DeploymentInfo deploymentInfo)
    {
        WebApplication app = builder.Build();

        // https://github.com/scalar/scalar/discussions/4468#discussioncomment-15371071
        app.UseForwardedHeaders();

        app.UseStaticFiles();
        app.MapOpenApi();

        app.MapScalarApiReference(options =>
        {
            options.WithTitle($"[{deploymentInfo.Environment}] Class4910 API")
                   .WithFavicon("/favicon.png")
                   .WithTheme(ScalarTheme.Kepler)
                   .AddPreferredSecuritySchemes(JwtBearerDefaults.AuthenticationScheme);
        });

        app.UseHttpsRedirection();
        app.UseCors(corsPolicyName);

        app.UseAuthorization();

        app.MapGet("/", () => Results.Ok(new
        {
            status = "Healthy",
            time = DateTime.UtcNow,
            deploymentInfo
        }));

        app.MapControllers();

        return app;
    }

    #region Database
    public static bool BuildDatabase(string connectionString)
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
                {OrgDescriptionField.SelectName} varchar(500) NULL,
	            {OrgPointWorthField.SelectName} decimal(4,2) NOT NULL DEFAULT 0.01,

	            {OrgCreatedAtUtcField.SelectName} DATETIME(6) NOT NULL,

	            CONSTRAINT Org_PK Primary Key ({OrgIdField.SelectName}),
                CONSTRAINT Orgs_UniqueName UNIQUE({OrgNameField.SelectName}),
                CONSTRAINT Org_PointWorth_NonNegative CHECK({OrgPointWorthField.SelectName} >= 0)
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


                {UserFirstNameField.SelectName} varchar(100) NULL,
                {UserLastNameField.SelectName} varchar(100) NULL,
                {UserPhoneField.SelectName} varchar(50) NULL,
                {UserCountryField.SelectName} varchar(100) NULL,
                {UserTimeZoneField.SelectName} varchar(100) NULL,

                {UserLastLoginTimeUtcField.SelectName} DATETIME(6) NULL,
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
            CREATE TABLE IF NOT EXISTS {DriversTable.Name} (
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

            // Driver Addresses Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS {DriverAddressesTable.Name} (
	            {DriverAddressIdField.SelectName} int AUTO_INCREMENT,
	            {DriverIdField.SelectName} int NOT NULL,

	            {DriverAddressCityField.SelectName} varchar(50) NOT NULL,
                {DriverAddressZipCodeField.SelectName} varchar(20) NOT NULL,
                {DriverAddressStateField.SelectName} varchar(20) NOT NULL,
                {DriverAddressLine1Field.SelectName} varchar(100) NOT NULL,
                {DriverAddressLine2Field.SelectName} varchar(100) NOT NULL,
	            {DriverAddressPrimaryField.SelectName} BOOLEAN DEFAULT 0 NOT NULL,
	            {DriverAddressAliasField.SelectName} varchar(100) DEFAULT '' NOT NULL,

	            CONSTRAINT DriverAddress_PK Primary Key ({DriverAddressIdField.SelectName}),
	            CONSTRAINT DriverAddress_Drivers_FK FOREIGN KEY ({DriverIdField.SelectName}) REFERENCES {DriversTable.Name}({DriverIdField.SelectName})
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
                {NotificationCreatedAtUtcField.SelectName} DATETIME(6) NOT NULL,  
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
                {ApplicationDriverMessageField.SelectName} varchar(1000) NOT NULL,
	            {ApplicationChangeReasonField.SelectName} varchar(1000) NULL,

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

            // ApiLogging Create
            command.CommandText = $@"
            CREATE TABLE IF NOT EXISTS `ApiLogging` (
              `id` int NOT NULL AUTO_INCREMENT,
              `Timestamp` varchar(100) DEFAULT NULL,
              `Level` varchar(15) DEFAULT NULL,
              `Template` text,
              `Message` text,
              `Exception` text,
              `Properties` text,
              `_ts` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`)
            )";
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
            throw new($"Failed to create tables. Command Text: {command.CommandText}. Error: {ex.Message}", ex);
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

    #endregion
}
