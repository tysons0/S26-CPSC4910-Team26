using Class4910Api;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient<EbayService>();

builder = Startup.CreateBuilder(builder);

WebApplication app = await Startup.ConfigureApp(builder);

app.Run();
