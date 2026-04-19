using System.Net;
using System.Net.Http.Json;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Tests.Integration.Generic;

namespace Class4910Tests.Integration;

public class UserControllerTests : IClassFixture<Class4910ApiFactory>
{
    private readonly Class4910ApiFactory _apiFactory;
    private readonly CancellationToken _cancelToken;

    public UserControllerTests(Class4910ApiFactory apiFactory)
    {
        _apiFactory = apiFactory;
        _apiFactory.InitializeAsync().GetAwaiter().GetResult();
        _cancelToken = CancellationToken.None;
    }

    private HttpClient CreateClient()
    {
        return _apiFactory.CreateClient();
    }

    [Fact]
    public async Task UpdateUser_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        UserUpdateRequest request = new()
        {
        };

        HttpResponseMessage response =
            await client.PutAsJsonAsync("User/1", request, _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateUser_AsDriverForOtherUser_ReturnsForbidden()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_update_forbidden_{Guid.NewGuid():N}",
            _cancelToken);

        UserUpdateRequest request = new()
        {
        };

        HttpResponseMessage response =
            await client.PutAsJsonAsync("User/999999", request, _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UpdateUser_AsDriverForSelf_ReturnsOkOrBadRequest()
    {
        HttpClient client = CreateClient();

        (_, _, Driver driver) = await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_update_self_{Guid.NewGuid():N}",
            _cancelToken);

        int userId = driver.UserData.Id;

        UserUpdateRequest request = new()
        {
        };

        HttpResponseMessage response =
            await client.PutAsJsonAsync($"User/{userId}", request, _cancelToken);

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected OK or BadRequest but got {response.StatusCode}");
    }

    [Fact]
    public async Task DisableUser_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response =
            await client.PatchAsync("User/1/disable", null, _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task EnableUser_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response =
            await client.PatchAsync("User/1/enable", null, _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DisableUser_AsDriverForOtherUser_ReturnsForbidden()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_disable_other_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.PatchAsync("User/999999/disable", null, _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task EnableUser_AsDriverForOtherUser_ReturnsForbidden()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_enable_other_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.PatchAsync("User/999999/enable", null, _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DisableUser_AsDriverForSelf_ReturnsOkOrBadRequest()
    {
        HttpClient client = CreateClient();

        (_, _, Driver driver) = await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_disable_self_{Guid.NewGuid():N}",
            _cancelToken);

        int userId = driver.UserData.Id;

        HttpResponseMessage response =
            await client.PatchAsync($"User/{userId}/disable", null, _cancelToken);

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected OK or BadRequest but got {response.StatusCode}");
    }

    [Fact]
    public async Task EnableUser_AsDriverForSelf_ReturnsOkOrBadRequest()
    {
        HttpClient client = CreateClient();

        (_, _, Driver driver) = await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_enable_self_{Guid.NewGuid():N}",
            _cancelToken);

        int userId = driver.UserData.Id;

        HttpResponseMessage response =
            await client.PatchAsync($"User/{userId}/enable", null, _cancelToken);

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected OK or BadRequest but got {response.StatusCode}");
    }

    [Fact]
    public async Task DisableUser_AsAdmin_BadUserId_ReturnsBadRequest()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInAdmin(
            client,
            $"admin_disable_bad_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.PatchAsync("User/999999/disable", null, _cancelToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task EnableUser_AsAdmin_BadUserId_ReturnsBadRequest()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInAdmin(
            client,
            $"admin_enable_bad_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.PatchAsync("User/999999/enable", null, _cancelToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}