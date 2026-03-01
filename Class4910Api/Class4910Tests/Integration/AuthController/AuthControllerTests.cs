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

        HttpResponseMessage response = await client.GetAsync(Routes.Auth.MeTokenInfoFull, _cancelToken);
        TokenInfo? tokenInfo = await GetClassFromResponse<TokenInfo>(response);

        // Assert
        Assert.Equal(expectedResponseCode, response.StatusCode);
        Assert.NotNull(tokenInfo);
    }

    [Theory]
    [InlineData(seedAdminUserName, seedAdminPassword, "newAdminPassword")]
    [InlineData(seedDriverUserName, seedDriverPassword, "newDriverPassword")]
    [InlineData(seedSponsorUserName, seedSponsorPassword, "newSponsorPassword")]
    public async Task ChangePassword_IsSuccessful_WithValidInformation(string username, string currentPassword, string newPassword)
    {
        // Arrange
        HttpStatusCode expectedResponseCode = HttpStatusCode.OK;
        HttpClient client = _apiFactory.CreateClient();
        UserRequest beforeChangeLoginRequest = new()
        {
            UserName = username,
            Password = currentPassword
        };
        UserRequest afterChangeLoginRequest = new() 
        { 
            UserName = username,
            Password = newPassword 
        };
        PasswordChangeRequest passwordChangeRequest = new()
        {
            UserName = username,
            CurrentPassword = currentPassword,
            NewPassword = newPassword,
        };
        PasswordChangeRequest passwordChangeBackRequest = new() 
        { 
            UserName = username,
            CurrentPassword = newPassword,
            NewPassword = currentPassword
        };

        // Act
        HttpResponseMessage loginResponse = await client.PostAsJsonAsync(Routes.Auth.LoginFull, beforeChangeLoginRequest, _cancelToken);
        LoginResult? loginResult = await GetClassFromResponse<LoginResult>(loginResponse);
        client = AttachTokenToClient(client, loginResult?.Token);

        HttpResponseMessage passwordChangeResponse = await client.PostAsJsonAsync(Routes.Auth.PasswordChangeFull, passwordChangeRequest, _cancelToken);

        HttpResponseMessage loginResponseAfter = await client.PostAsJsonAsync(Routes.Auth.LoginFull, afterChangeLoginRequest, _cancelToken);
        LoginResult? loginResultAfter = await GetClassFromResponse<LoginResult>(loginResponseAfter);
        client = AttachTokenToClient(client, loginResultAfter?.Token);

        HttpResponseMessage passwordChangeBackResponse = await client.PostAsJsonAsync(Routes.Auth.PasswordChangeFull, passwordChangeBackRequest, _cancelToken);

        HttpResponseMessage loginResponseAfterChangeBack = await client.PostAsJsonAsync(Routes.Auth.LoginFull, beforeChangeLoginRequest, _cancelToken);
        LoginResult? loginResultAfterChangeBack = await GetClassFromResponse<LoginResult>(loginResponseAfterChangeBack);

        // Assert
        Assert.Equal(expectedResponseCode, loginResponse.StatusCode);
        Assert.Equal(expectedResponseCode, passwordChangeResponse.StatusCode);
        Assert.Equal(expectedResponseCode, loginResponseAfter.StatusCode);
        Assert.Equal(expectedResponseCode, passwordChangeBackResponse.StatusCode);
        Assert.Equal(expectedResponseCode, loginResponseAfterChangeBack.StatusCode);

        Assert.NotNull(loginResult);
        Assert.NotNull(loginResultAfter);
        Assert.NotNull(loginResultAfterChangeBack);

        Assert.NotNull(loginResult.User);
        Assert.NotNull(loginResultAfter.User);
        Assert.NotNull(loginResultAfterChangeBack.User);

        Assert.Null(loginResult.Error);
        Assert.Null(loginResultAfter.Error);
        Assert.Null(loginResultAfterChangeBack.Error);

        Assert.Equal(loginResult.User.Username, username);
        Assert.Equal(loginResultAfter.User.Username, username);
        Assert.Equal(loginResultAfterChangeBack.User.Username, username);
    }


    [Theory]
    [InlineData("testAdmin1", "testAdminPw1")]
    [InlineData("testAdmin2", "SpecialCharacterstestAdminPw1{]}!)")]
    [InlineData("testAdmin3", "LongPasswordTesttestAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1")]
    [InlineData("LongUsernametestAdmin4UsernametestAdmin49", "testAdminPw")]
    [InlineData("SpecialCahracterstestAdmin5[]!SAIJ@#8", "testAdminPw")]
    [InlineData("testAdmin69837120", "testAdminPw1")]
    [InlineData("LongUsernametestAdmin4UsernametestAdmin43", "SpecialCharacterstestAdminPw1{]}!)")]
    [InlineData("SpecialCahracterstestAdmin5[]!SAIJ@#23", "SpecialCharacterstestAdminPw1{]}!)")]
    [InlineData("LongUsernametestAdmin4UsernametestAdmin41", "LongPasswordTesttestAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1")]
    [InlineData("SpecialCahracterstestAdmin5[]!SAIJ@#2", "LongPasswordTesttestAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1testAdminPw1")]
    public async Task RegisterAdmin_IsSuccessful_WithValidInputAndToken(string username, string password)
    {
        // Arrange
        HttpStatusCode expectedRegisterResponseCode = HttpStatusCode.Created;
        HttpStatusCode expectedLoginResponseCode = HttpStatusCode.OK;
        HttpClient client = _apiFactory.CreateClient();
        UserRequest userRequest = new()
        {
            UserName = username,
            Password = password
        };

        // Act
        HttpResponseMessage seedAdminloginResponse = await client.PostAsJsonAsync(Routes.Auth.LoginFull, seedAdminRequest, _cancelToken);
        LoginResult? seedAdminloginResult = await GetClassFromResponse<LoginResult>(seedAdminloginResponse);
        client = AttachTokenToClient(client, seedAdminloginResult?.Token);

        HttpResponseMessage registerResponse = await client.PostAsJsonAsync(Routes.Auth.RegisterAdminFull, userRequest, _cancelToken);

        HttpResponseMessage loginResponse = await client.PostAsJsonAsync(Routes.Auth.LoginFull, userRequest, _cancelToken);
        LoginResult? loginResult = await GetClassFromResponse<LoginResult>(loginResponse);

        // Assert
        Assert.Equal(expectedRegisterResponseCode, registerResponse.StatusCode);
        Assert.Equal(expectedLoginResponseCode, loginResponse.StatusCode);

        Assert.NotNull(loginResult);
        Assert.NotNull(loginResult.User);

        Assert.Null(loginResult.Error);

        Assert.Equal(loginResult.User.Username, username);
    }

    [Theory]
    [InlineData("testDriver1", "testDriverPw1")]
    [InlineData("testDriver2", "SpecialCharacterstestDriverPw1{]}!)")]
    [InlineData("testDriver3", "LongPasswordTesttestDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1")]
    [InlineData("LongUsernametestDriver4UsernametestDriver4", "testDriverPw")]
    [InlineData("SpecialCahracterstestDriver5[]!SAIJ@#", "testDriverPw")]
    [InlineData("testDriver6983712", "testDriverPw1")]
    [InlineData("LongUsernametestDriver4UsernametestDriver42", "SpecialCharacterstestDriverPw1{]}!)")]
    [InlineData("SpecialCahracterstestDriver5[]!SAIJ@#3", "SpecialCharacterstestDriverPw1{]}!)")]
    [InlineData("LongUsernametestDriver4UsernametestDriver49", "LongPasswordTesttestDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1")]
    [InlineData("SpecialCahracterstestDriver5[]!SAIJ@#8", "LongPasswordTesttestDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1testDriverPw1")]
    public async Task RegisterDriver_IsSuccessful_WithValidInput(string username, string password)
    {
        // Arrange
        HttpStatusCode expectedRegisterResponseCode = HttpStatusCode.Created;
        HttpStatusCode expectedLoginResponseCode = HttpStatusCode.OK;
        HttpClient client = _apiFactory.CreateClient();
        UserRequest userRequest = new()
        {
            UserName = username,
            Password = password
        };

        // Act
        HttpResponseMessage registerResponse = await client.PostAsJsonAsync(Routes.Auth.RegisterDriverFull, userRequest, _cancelToken);

        HttpResponseMessage loginResponse = await client.PostAsJsonAsync(Routes.Auth.LoginFull, userRequest, _cancelToken);
        LoginResult? loginResult = await GetClassFromResponse<LoginResult>(loginResponse);

        // Assert
        Assert.Equal(expectedRegisterResponseCode, registerResponse.StatusCode);
        Assert.Equal(expectedLoginResponseCode, loginResponse.StatusCode);

        Assert.NotNull(loginResult);
        Assert.NotNull(loginResult.User);

        Assert.Null(loginResult.Error);

        Assert.Equal(loginResult.User.Username, username);
    }

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
