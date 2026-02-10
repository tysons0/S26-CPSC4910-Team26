using System.Text;
using Class4910Api.Configuration.Database;
using Class4910Api.Models;
using Class4910Api.Services;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MySql.Data.MySqlClient;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Sinks.MySQL;

namespace Class4910Api.Configuration;

public static class Startup
{
    public const string corsPolicyName = "AllowAll";

    public static WebApplicationBuilder CreateBuilder(WebApplicationBuilder builder)
    {
        builder = AddServices(builder);

        DatabaseConnection dbConn = builder.Configuration.GetRequiredSection("DatabaseConnection").Get<DatabaseConnection>()!;

        AddLogging(builder, dbConn);

        SeedDatabaseMethods.SeedDatabase(dbConn.Connection);

        return builder;
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

        builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

        builder.Services.AddScoped<IAuthService, AuthService>();
        builder.Services.AddScoped<IContextService, ContextService>();

        builder.Services.AddScoped<IUserService, UserService>();
        builder.Services.AddScoped<IAdminService, AdminService>();
        builder.Services.AddScoped<IDriverService, DriverService>();
        builder.Services.AddScoped<ISponsorService, SponsorService>();
        builder.Services.AddScoped<IOrganizationService, OrganizationService>();

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

        app.MapControllers();

        using (IServiceScope scope = app.Services.CreateScope())
        {
            var tokenSettings = scope.ServiceProvider.GetRequiredService<IOptions<JwtSettings>>();
            JwtSettings jwtSettings = tokenSettings.Value;

            IAuthService authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
            IOrganizationService orgService = scope.ServiceProvider.GetRequiredService<IOrganizationService>();
            IAdminService adminService = scope.ServiceProvider.GetRequiredService<IAdminService>();

            RequestData requestData = new()
            {
                ClientIP = System.Net.IPAddress.Loopback,
                UserAgent = "SEED SCOPE"
            };

            Admin? seedAdmin = await adminService.GetAdminByName(ConstantValues.seedAdminRequest.UserName);
            seedAdmin ??= await authService.RegisterAdminUser(ConstantValues.seedAdminRequest, requestData);

            if (seedAdmin is null)
            {
                throw new("Failed to create Seed Admin");
            }

            Organization? seedOrg = await orgService.GetOrganizationByName(ConstantValues.seedOrgName);
            seedOrg ??= await orgService.CreateOrganization(ConstantValues.seedOrgName, seedAdmin.UserData.Id);

            if (seedOrg is null)
            {
                throw new("Failed to create Seed Org");
            }

            await authService.RegisterDriverUser(ConstantValues.seedDriverRequest, requestData);
            await authService.RegisterSponsorUser(ConstantValues.seedSponsorRequest, seedOrg.OrgId, seedAdmin.UserData.Id, requestData);
        }

        return app;
    }
}
