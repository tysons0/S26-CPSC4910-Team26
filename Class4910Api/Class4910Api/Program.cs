using Class4910Api;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder = Startup.CreateBuilder(builder);

WebApplication app = await Startup.ConfigureApp(builder);

app.Run();
