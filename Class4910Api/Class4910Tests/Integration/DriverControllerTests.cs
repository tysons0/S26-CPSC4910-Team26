using System.Net;
using System.Net.Http.Json;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Tests.Integration.Generic;
using static Class4910Tests.Integration.Generic.GenericAuthActions;

namespace Class4910Tests.Integration;

public class DriverControllerTests : IClassFixture<Class4910ApiFactory>
{
    private readonly Class4910ApiFactory _apiFactory;
    private readonly CancellationToken _cancelToken;

    public DriverControllerTests(Class4910ApiFactory apiFactory)
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
    public async Task GetCurrentDriver_AsDriver_ReturnsOk()
    {
        (HttpClient client, _, Driver registeredDriver) =
            await CreateLoggedInDriver(CreateClient(), $"driver_me_{Guid.NewGuid():N}", _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Driver/me", _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        Driver? result = await ApiHelper.GetClassFromResponse<Driver>(response, _cancelToken);

        Assert.NotNull(result);
        Assert.Equal(registeredDriver.DriverId, result!.DriverId);
    }

    [Fact]
    public async Task GetCurrentDriver_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response = await client.GetAsync("Driver/me", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCurrentDriverPointAlertPreference_AsDriver_ReturnsOk()
    {
        (HttpClient client, _, _) =
            await CreateLoggedInDriver(CreateClient(), $"driver_alert_{Guid.NewGuid():N}", _cancelToken);

        DriverPointsAlertPreferenceRequest request = new()
        {
            Enabled = true
        };

        HttpResponseMessage response =
            await client.PatchAsJsonAsync("Driver/me/points-alert", request, _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        Driver? updated = await ApiHelper.GetClassFromResponse<Driver>(response, _cancelToken);

        Assert.NotNull(updated);
        Assert.True(updated!.NotifyForPointsChanged);
    }

    [Fact]
    public async Task GetAllDrivers_AsDriver_ReturnsForbidden()
    {
        (HttpClient client, _, _) =
            await CreateLoggedInDriver(CreateClient(), $"driver_all_{Guid.NewGuid():N}", _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Driver", _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetAllDrivers_AsAdmin_ReturnsOk()
    {
        (HttpClient client, _, _) =
            await CreateLoggedInAdmin(CreateClient(), $"admin_all_{Guid.NewGuid():N}", _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Driver", _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        List<Driver>? drivers =
            await ApiHelper.GetClassFromResponse<List<Driver>>(response, _cancelToken);

        Assert.NotNull(drivers);
    }

    [Fact]
    public async Task GetDriver_AsSelf_ReturnsOk()
    {
        (HttpClient client, _, Driver driver) =
            await CreateLoggedInDriver(CreateClient(), $"driver_self_{Guid.NewGuid():N}", _cancelToken);

        int userId = driver.UserData.Id;

        HttpResponseMessage response = await client.GetAsync($"Driver/{userId}", _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        Driver? result = await ApiHelper.GetClassFromResponse<Driver>(response, _cancelToken);

        Assert.NotNull(result);
        Assert.Equal(driver.DriverId, result!.DriverId);
    }

    [Fact]
    public async Task GetDriver_WithBadUserId_ReturnsNotFound()
    {
        (HttpClient client, _, _) =
            await CreateLoggedInDriver(CreateClient(), $"driver_missing_{Guid.NewGuid():N}", _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Driver/999999", _cancelToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetDriverAddresses_WithBadDriverId_ReturnsBadRequest()
    {
        (HttpClient client, _, _) =
            await CreateLoggedInDriver(CreateClient(), $"driver_addr_{Guid.NewGuid():N}", _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Driver/999999/address", _cancelToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddDriverAddress_WithBadDriverId_ReturnsBadRequest()
    {
        (HttpClient client, _, _) =
            await CreateLoggedInDriver(CreateClient(), $"driver_add_addr_{Guid.NewGuid():N}", _cancelToken);

        AddressRequest request = new()
        {
            AddressAlias = string.Empty,
            Primary = false,
            AddressLine1 = "123 Test St",
            AddressLine2 = "",
            City = "Anderson",
            State = "SC",
            ZipCode = "29621"
        };

        HttpResponseMessage response =
            await client.PostAsJsonAsync("Driver/999999/address", request, _cancelToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateDriverPoints_AsDriver_ReturnsForbidden()
    {
        (HttpClient client, _, Driver driver) =
            await CreateLoggedInDriver(CreateClient(), $"driver_points_{Guid.NewGuid():N}", _cancelToken);

        PointChangeRequest request = new()
        {
            OrgId = 1,
            PointChange = 5,
            ChangeReason = "test"
        };

        HttpResponseMessage response =
            await client.PatchAsJsonAsync($"Driver/{driver.DriverId}/points", request, _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UpdateDriverPoints_AsSponsor_BadDriverId_ReturnsBadRequest()
    {
        (HttpClient client, _, _) =
            await CreateLoggedInSponsor(CreateClient(), $"sponsor_points_{Guid.NewGuid():N}", _cancelToken);

        PointChangeRequest request = new()
        {
            OrgId = 1,
            PointChange = 5,
            ChangeReason = "test"
        };

        HttpResponseMessage response =
            await client.PatchAsJsonAsync("Driver/999999/points", request, _cancelToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetDriverPointHistory_BadDriverId_ReturnsBadRequest()
    {
        (HttpClient client, _, _) =
            await CreateLoggedInDriver(CreateClient(), $"driver_history_{Guid.NewGuid():N}", _cancelToken);

        HttpResponseMessage response =
            await client.GetAsync("Driver/999999/pointhistory", _cancelToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
