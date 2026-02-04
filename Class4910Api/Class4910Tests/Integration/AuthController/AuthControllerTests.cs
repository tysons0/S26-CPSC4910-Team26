using System;
using System.Collections.Generic;
using System.Text;
using Class4910Api.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Class4910Tests.Integration.AuthController;

public class AuthControllerTests : IClassFixture<Class4910ApiFactory>
{
    private readonly Class4910ApiFactory _apiFactory;
    private readonly JwtSettings _jwtSettings;

    public AuthControllerTests(Class4910ApiFactory apiFactory)
    {
        _apiFactory = apiFactory;
        _apiFactory.InitializeAsync().GetAwaiter().GetResult();

        using var scope = _apiFactory.Services.CreateScope();
        var tokenSettings = scope.ServiceProvider.GetRequiredService<IOptions<JwtSettings>>();
        _jwtSettings = tokenSettings.Value;
    }

    [Fact]
    public async Task SampleTestSuccess()
    {
        int left = 1, right = 1;
        Assert.True(left == right);
    }
}
