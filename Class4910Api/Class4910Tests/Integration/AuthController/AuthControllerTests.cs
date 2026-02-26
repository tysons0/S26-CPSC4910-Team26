using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Class4910Api;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using static Class4910Api.ConstantValues;

namespace Class4910Tests.Integration.AuthController;

public class AuthControllerTests : IClassFixture<Class4910ApiFactory>
{
    private readonly Class4910ApiFactory _apiFactory;
    private readonly JwtSettings _jwtSettings;
    private readonly CancellationToken _cancelToken;

    public AuthControllerTests(Class4910ApiFactory apiFactory)
    {
        _apiFactory = apiFactory;
        _apiFactory.InitializeAsync().GetAwaiter().GetResult();

        using var scope = _apiFactory.Services.CreateScope();
        var tokenSettings = scope.ServiceProvider.GetRequiredService<IOptions<JwtSettings>>();
        _jwtSettings = tokenSettings.Value;
        _cancelToken = TestContext.Current.CancellationToken;
    }

    [Theory]
    [InlineData(seedAdminUserName, seedAdminPassword)]
    [InlineData(seedDriverUserName, seedDriverPassword)]
    [InlineData(seedSponsorUserName, seedSponsorPassword)]
    public async Task Login_ReturnsLegitimateAuthToken_WithValidCredentials(string username, string password)
    {
        // Arrange
        HttpStatusCode expectedResponseCode = HttpStatusCode.OK;
        HttpClient client = _apiFactory.CreateClient();

        UserRequest request = new()
        {
            UserName = username,
            Password = password
        };

        // Act
        HttpResponseMessage response = await client.PostAsJsonAsync(Routes.Auth.LoginFull, request, _cancelToken);
        LoginResult? result = await GetClassFromResponse<LoginResult>(response);

        // Assert
        Assert.Equal(expectedResponseCode, response.StatusCode);
        Assert.NotNull(result);
        Assert.False(string.IsNullOrEmpty(result.Token), "Expected a non-empty token in the response.");
        Assert.StartsWith("ey", result.Token);
        Assert.NotNull(result.User);
    }

    [Theory]
    [InlineData(seedAdminUserName + "invalid", seedAdminPassword)]
    [InlineData(seedDriverUserName + "invalid", seedDriverPassword)]
    [InlineData(seedSponsorUserName + "invalid", seedSponsorPassword)]
    [InlineData(seedAdminUserName, seedAdminPassword + "invalid")]
    [InlineData(seedDriverUserName, seedDriverPassword + "invalid")]
    [InlineData(seedSponsorUserName, seedSponsorPassword + "invalid")]
    [InlineData("", "")]
    public async Task Login_ReturnsBadRequest_WithInvalidCredentials(string username, string password)
    {
        // Arrange
        HttpStatusCode expectedResponseCode = HttpStatusCode.BadRequest;
        HttpClient client = _apiFactory.CreateClient();

        UserRequest request = new()
        {
            UserName = username,
            Password = password
        };

        // Act
        HttpResponseMessage response = await client.PostAsJsonAsync(Routes.Auth.LoginFull, request, _cancelToken);
        LoginResult? result = await GetClassFromResponse<LoginResult>(response);

        // Assert
        Assert.Equal(expectedResponseCode, response.StatusCode);
        Assert.Null(result);
        Assert.Null(result?.User);
    }

    [Fact]
    public async Task Login_ReturnsBadRequest_WithEmptyRequest()
    {
        // Arrange
        HttpStatusCode expectedResponseCode = HttpStatusCode.BadRequest;
        HttpClient client = _apiFactory.CreateClient();

        // Act
        HttpResponseMessage response = await client.PostAsJsonAsync(Routes.Auth.LoginFull, new { }, _cancelToken);
        LoginResult? result = await GetClassFromResponse<LoginResult>(response);

        // Assert
        Assert.Equal(expectedResponseCode, response.StatusCode);
        Assert.Null(result);
        Assert.Null(result?.User);
    }

    [Theory]
    [InlineData(seedAdminUserName, seedAdminPassword)]
    [InlineData(seedDriverUserName, seedDriverPassword)]
    [InlineData(seedSponsorUserName, seedSponsorPassword)]
    public async Task Me_ReturnsUser_WithValidLogin(string username, string password)
    {
        // Arrange
        HttpStatusCode expectedResponseCode = HttpStatusCode.OK;
        HttpClient client = _apiFactory.CreateClient();

        UserRequest request = new()
        {
            UserName = username,
            Password = password
        };

        // Act
        HttpResponseMessage loginResponse = await client.PostAsJsonAsync(Routes.Auth.LoginFull, request, _cancelToken);
        LoginResult? result = await GetClassFromResponse<LoginResult>(loginResponse);

        client = AttachTokenToClient(client, result?.Token);

        HttpResponseMessage response = await client.GetAsync(Routes.Auth.MeFull, _cancelToken);
        UserRead? userData = await GetClassFromResponse<UserRead>(response);

        // Assert
        Assert.Equal(expectedResponseCode, response.StatusCode);
        Assert.NotNull(userData);
        Assert.Equal(username, userData.Username);
    }

    [Theory]
    [InlineData(seedAdminUserName + "invalid", seedAdminPassword)]
    [InlineData(seedDriverUserName + "invalid", seedDriverPassword)]
    [InlineData(seedSponsorUserName + "invalid", seedSponsorPassword)]
    [InlineData(seedAdminUserName, seedAdminPassword + "invalid")]
    [InlineData(seedDriverUserName, seedDriverPassword + "invalid")]
    [InlineData(seedSponsorUserName, seedSponsorPassword + "invalid")]
    [InlineData("", "")]
    public async Task Me_ReturnsUnAuthorized_WithInvalidLogin(string username, string password)
    {
        // Arrange
        HttpStatusCode expectedResponseCode = HttpStatusCode.Unauthorized;
        HttpClient client = _apiFactory.CreateClient();

        UserRequest request = new()
        {
            UserName = username,
            Password = password
        };

        // Act
        HttpResponseMessage loginResponse = await client.PostAsJsonAsync(Routes.Auth.LoginFull, request, _cancelToken);
        LoginResult? result = await GetClassFromResponse<LoginResult>(loginResponse);

        client = AttachTokenToClient(client, result?.Token);

        HttpResponseMessage response = await client.GetAsync(Routes.Auth.MeFull, _cancelToken);
        UserRead? userData = await GetClassFromResponse<UserRead>(response);

        // Assert
        Assert.Equal(expectedResponseCode, response.StatusCode);
        Assert.Null(userData);
    }

#warning Add GetTokenInfo 

    [Theory]
    [InlineData(seedAdminUserName, seedAdminPassword)]
    [InlineData(seedDriverUserName, seedDriverPassword)]
    [InlineData(seedSponsorUserName, seedSponsorPassword)]
    public async Task GetTokenInfo_ReturnsValidInfo_WithValidLogin(string username, string password)
    {
        // Arrange
        HttpStatusCode expectedResponseCode = HttpStatusCode.OK;
        HttpClient client = _apiFactory.CreateClient();
        UserRequest request = new()
        {
            UserName = username,
            Password = password
        };
        // Act
        HttpResponseMessage loginResponse = await client.PostAsJsonAsync(Routes.Auth.LoginFull, request, _cancelToken);
        LoginResult? result = await GetClassFromResponse<LoginResult>(loginResponse);
        client = AttachTokenToClient(client, result?.Token);

        HttpResponseMessage response = await client.GetAsync(Routes.Auth.MeTokenInfo, _cancelToken);
        TokenInfo? tokenInfo = await GetClassFromResponse<TokenInfo>(response);

        // Assert
        Assert.Equal(expectedResponseCode, response.StatusCode);
        Assert.NotNull(tokenInfo);
#warning Add more assertions to validate the token info properties
    }
#warning Add ChangePassword
#warning Add RegisterAdmin
#warning Add RegisterDriver
#warning Add RegisterSponsor

    private async Task<T?> GetClassFromResponse<T>(HttpResponseMessage response) where T : class
    {
        if (response.StatusCode == HttpStatusCode.OK)
        {
            return await response.Content.ReadFromJsonAsync<T>(_cancelToken);
        }

        return null;
    }

    private static HttpClient AttachTokenToClient(HttpClient client, string? token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token ?? "");
        return client;
    }
}
