using System;
using System.Collections.Generic;
using System.Text;
using Class4910Api.Configuration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.TestPlatform.TestHost;
using Testcontainers.MySql;
using static Org.BouncyCastle.Math.EC.ECCurve;

namespace Class4910Tests.Integration;

public class Class4910ApiFactory : WebApplicationFactory<Program>, IAsyncDisposable
{
    private readonly MySqlContainer _dbContainer =
        new MySqlBuilder(image: "mysql:8.0.44")
            .WithDatabase("Class4910")
            .WithUsername("root")
            .WithPassword("my-secret-pw")
            .WithPortBinding(3306, assignRandomHostPort: true)
            .Build();

    public string ConnectionString => _dbContainer.GetConnectionString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.AddConsole();
        });

        builder.ConfigureAppConfiguration((context, config) =>
        {
            Dictionary<string, string?> overrideConfig = new()
            {
                ["DatabaseConnection:Connection"] = ConnectionString
            };

            config.AddInMemoryCollection(overrideConfig);
        });
    }

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();
    }

    public override async ValueTask DisposeAsync()
    {
        Console.WriteLine($"Disposing of Class4910ApiFactory UTC:{DateTime.UtcNow}");
        await _dbContainer.StopAsync();
        await _dbContainer.DisposeAsync();
        await base.DisposeAsync();
    }
}
