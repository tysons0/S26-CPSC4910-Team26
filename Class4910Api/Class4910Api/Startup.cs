using System.Text;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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

        DatabaseConnection dbConn = builder.Configuration.GetRequiredSection("DatabaseConnection").Get<DatabaseConnection>()!;

        AddLogging(builder, dbConn);

        SeedDatabaseMethods.SeedDatabase(dbConn.Connection);

        return builder;
    }
        catch(Exception ex)
        {
            Console.WriteLine($"An error occurred during startup: {ex.Message}");
            Log.Error(ex, "An error occurred during startup");
            throw;
        }
    }

    public static WebApplicationBuilder AddLogging(WebApplicationBuilder builder, DatabaseConnection dbConn)
    {

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .Enrich.FromLogContext()
            .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Error)
            .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Error)
            .WriteTo.Console()
            .WriteTo.MySQL(
                connectionString: dbConn.Connection,
                tableName: ConstantValues.ApiLoggingTable.Name
            )
            .CreateLogger();

        Log.Information("Logger configured successfully");

        builder.Host.UseSerilog();
        return builder;
    }

    public static WebApplicationBuilder AddServices(WebApplicationBuilder builder)
    {
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

        builder = AddLifetimeServices(builder);

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

        builder.Services.AddHttpClient<IEbayService, EbayService>();

        return builder;
    }

    public static async Task<WebApplication> ConfigureApp(WebApplicationBuilder builder)
    {
        WebApplication app = builder.Build();

        app.MapOpenApi();
        app.MapScalarApiReference(options =>
        {
            options.WithTitle("Class4910 API")
                   .WithTheme(ScalarTheme.Kepler)
                   .AddPreferredSecuritySchemes(JwtBearerDefaults.AuthenticationScheme);
        });

        app.UseCors(corsPolicyName);

        app.UseAuthorization();

        app.MapGet("/", () => Results.Ok(new
        {
            status = "Healthy",
            time = DateTime.UtcNow
        }));

        app.MapControllers();
        try
        {
            using (IServiceScope scope = app.Services.CreateScope())
            {
                var tokenSettings = scope.ServiceProvider.GetRequiredService<IOptions<JwtSettings>>();
                JwtSettings jwtSettings = tokenSettings.Value;

                // Add all services to make sure all can be initialized
                IEbayService ebayService = scope.ServiceProvider.GetRequiredService<IEbayService>();
                IContextService contextService = scope.ServiceProvider.GetRequiredService<IContextService>();

                // Services needed for seeding
                IAuthService authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
                IOrganizationService orgService = scope.ServiceProvider.GetRequiredService<IOrganizationService>();
                IAdminService adminService = scope.ServiceProvider.GetRequiredService<IAdminService>();
                IDriverService driverService = scope.ServiceProvider.GetRequiredService<IDriverService>();
                ISponsorService sponsorService = scope.ServiceProvider.GetRequiredService<ISponsorService>();

                RequestData requestData = new()
                {
                    ClientIP = System.Net.IPAddress.Loopback,
                    UserAgent = "SEED SCOPE"
                };

                Admin? seedAdmin = await adminService.GetAdminByName(ConstantValues.seedAdminRequest.UserName);
                seedAdmin ??= await authService.RegisterAdminUser(ConstantValues.seedAdminRequest, requestData);

                if (seedAdmin is null)
                    throw new("Failed to create Seed Admin");

                Organization? seedOrg = await orgService.GetOrganizationByName(ConstantValues.seedOrgName);
                seedOrg ??= await orgService.CreateOrganization(ConstantValues.seedOrgName, seedAdmin.UserData.Id);

                if (seedOrg is null)
                    throw new("Failed to create Seed Org");

                Driver? seedDriver = await driverService.GetDriverByName(ConstantValues.seedDriverRequest.UserName);
                Sponsor? seedSponsor = await sponsorService.GetSponsorByName(ConstantValues.seedSponsorRequest.UserName);

                seedDriver ??= await authService.RegisterDriverUser(ConstantValues.seedDriverRequest, requestData);
                seedSponsor ??= await authService.RegisterSponsorUser(ConstantValues.seedSponsorRequest, seedOrg.OrgId, seedAdmin.UserData.Id, requestData);
            }
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "An error occurred while seeding the database");
            throw;
        }

        return app;
    }
}
