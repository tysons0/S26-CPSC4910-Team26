using Class4910Api.Configuration;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder = Startup.CreateBuilder(builder);

WebApplication app = Startup.ConfigureApp(builder);

app.Run();
