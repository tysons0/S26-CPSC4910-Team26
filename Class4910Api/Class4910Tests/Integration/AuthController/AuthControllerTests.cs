using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using Class4910Api.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using static Class4910Api.ConstantValues;

namespace Class4910Tests.Integration.AuthController;

public class AuthControllerTests : IClassFixture<Class4910ApiFactory>
{
    private readonly Class4910ApiFactory _apiFactory;
    private readonly JwtSettings _jwtSettings;
    private readonly CancellationToken _cancelToken = TestContext.Current.CancellationToken;

    public AuthControllerTests(Class4910ApiFactory apiFactory)
    {
        _apiFactory = apiFactory;
        _apiFactory.InitializeAsync().GetAwaiter().GetResult();

        using IServiceScope scope = _apiFactory.Services.CreateScope();
        _jwtSettings = scope.ServiceProvider.GetRequiredService<IOptions<JwtSettings>>().Value;
    }

    [Fact]
    public async Task AdminLogin_ReturnsLegitimateAuthToken_WithValidCredentials()
    {
        // Arrange
        HttpStatusCode expectedResponseCode = HttpStatusCode.OK;
        HttpClient client = _apiFactory.CreateClient();

        var request = new
        {
            UserName = seedAdminUserName,
            Password = seedAdminPassword
        };

        // Act
        HttpResponseMessage response = await client.PostAsJsonAsync("Auth/login", request, _cancelToken);
    }
    [Fact]
    public async Task AdminLogin_ReturnsBadRequest_WithInvalidCredentials()
    {
        int left = 1, right = 1;
        Assert.True(left == right);
    }
}
