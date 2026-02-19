using Class4910Api;
using Class4910Api.Configuration;

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

app.Run();
