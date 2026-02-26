using Class4910Api;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using Serilog;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder = Startup.CreateBuilder(builder);

DeploymentInfo deploymentInfo = new()
{
    BuildDate = builder.Configuration["DEPLOYED_AT"] ?? "Date Not Found. Date Now: " + FormatHelper.FormatDate(DateTime.UtcNow),
    Environment = builder.Configuration["ASPNETCORE_ENVIRONMENT"] ?? "Unknown",
    Version = builder.Configuration["VERSION"] ?? "Unknown",
    CommitName = builder.Configuration["COMMIT_NAME"] ?? "Unknown",
    Tag = builder.Configuration["GIT_TAG"] ?? "Unknown"
};

WebApplication app = await Startup.ConfigureApp(builder, deploymentInfo);

DatabaseConnection dbConnectionInfo =
                builder.Configuration.GetRequiredSection("DatabaseConnection").Get<DatabaseConnection>()!;

Startup.BuildDatabase(dbConnectionInfo.Connection);

try
{
    using IServiceScope scope = app.Services.CreateScope();
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
    seedOrg ??= await orgService.CreateOrganization(ConstantValues.seedOrgRequest, seedAdmin.UserData.Id);

    if (seedOrg is null)
        throw new("Failed to create Seed Org");

    Driver? seedDriver = await driverService.GetDriverByName(ConstantValues.seedDriverRequest.UserName);
    Sponsor? seedSponsor = await sponsorService.GetSponsorByName(ConstantValues.seedSponsorRequest.UserName);

    seedDriver ??= await authService.RegisterDriverUser(ConstantValues.seedDriverRequest, requestData);
    seedSponsor ??= await authService.RegisterSponsorUser(ConstantValues.seedSponsorRequest, seedOrg.OrgId, seedAdmin.UserData.Id, requestData);
}
catch (Exception ex)
{
    Log.Fatal(ex, "An error occurred while seeding the database");
    throw;
}

app.Run();
