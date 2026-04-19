using System.Net;
using System.Net.Http.Json;
using Class4910Api.Models;
using Class4910Tests.Integration.Generic;

namespace Class4910Tests.Integration;

public class NotificationControllerTests : IClassFixture<Class4910ApiFactory>
{
    private readonly Class4910ApiFactory _apiFactory;
    private readonly CancellationToken _cancelToken;

    public NotificationControllerTests(Class4910ApiFactory apiFactory)
    {
        _apiFactory = apiFactory;
        _apiFactory.InitializeAsync().GetAwaiter().GetResult();

        _cancelToken = TestContext.Current.CancellationToken;
    }

    private HttpClient CreateClient()
    {
        return _apiFactory.CreateClient();
    }

    [Fact]
    public async Task GetMyNotifications_AsDriver_ReturnsOk()
    {
        HttpClient client = CreateClient();
        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_notifications_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Notification/me", _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        List<Notification>? notifications =
            await ApiHelper.GetClassFromResponse<List<Notification>>(response, _cancelToken);

        Assert.NotNull(notifications);
    }

    [Fact]
    public async Task GetMyNotifications_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response = await client.GetAsync("Notification/me", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetNotifications_AsDriver_ReturnsForbidden()
    {
        HttpClient client = CreateClient();
        (_, _, Driver driver) = await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_forbidden_{Guid.NewGuid():N}",
            _cancelToken);

        int userId = driver.UserData.Id;

        HttpResponseMessage response = await client.GetAsync($"Notification/{userId}", _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetNotifications_AsSponsor_ReturnsForbidden()
    {
        HttpClient client = CreateClient();
        (_, _, Sponsor sponsor) = await GenericAuthActions.CreateLoggedInSponsor(
            client,
            $"sponsor_forbidden_{Guid.NewGuid():N}",
            _cancelToken);

        int userId = sponsor.UserData.Id;

        HttpResponseMessage response = await client.GetAsync($"Notification/{userId}", _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetNotifications_AsAdmin_ReturnsOk()
    {
        HttpClient client = CreateClient();
        (_, _, Admin admin) = await GenericAuthActions.CreateLoggedInAdmin(
            client,
            $"admin_notifications_{Guid.NewGuid():N}",
            _cancelToken);

        int userId = admin.UserData.Id;

        HttpResponseMessage response = await client.GetAsync($"Notification/{userId}", _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        List<Notification>? notifications =
            await ApiHelper.GetClassFromResponse<List<Notification>>(response, _cancelToken);

        Assert.NotNull(notifications);
    }

    [Fact]
    public async Task CreateNotification_AsDriverForSelf_ReturnsOk()
    {
        HttpClient client = CreateClient();
        (_, _, Driver driver) = await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_create_notification_{Guid.NewGuid():N}",
            _cancelToken);

        int userId = driver.UserData.Id;
        string message = "Test notification";

        HttpResponseMessage response =
            await client.PostAsJsonAsync($"Notification/{userId}", message, _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CreateNotification_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();
        string message = "Test notification";

        HttpResponseMessage response =
            await client.PostAsJsonAsync("Notification/1", message, _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MarkNotificationAsSeen_WithBadNotificationId_ReturnsBadRequest()
    {
        HttpClient client = CreateClient();
        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_seen_bad_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.PatchAsync("Notification/999999/seen", null, _cancelToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
