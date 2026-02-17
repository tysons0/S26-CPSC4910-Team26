using Class4910Api;
using Class4910Api.Services;
using Class4910Api.Services.Interfaces;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// builder.Services.AddHttpClient<EbayService>();
builder.Services.AddHttpClient<IEbayService, EbayService>();

builder = Startup.CreateBuilder(builder);

WebApplication app = await Startup.ConfigureApp(builder);

app.Run();
