using System.Net;
using System.Net.Http.Json;
using Class4910Api.Models;
using Class4910Tests.Integration.Generic;

namespace Class4910Tests.Integration;

public class ApplicationControllerTests : IClassFixture<Class4910ApiFactory>
{
    private readonly Class4910ApiFactory _apiFactory;
    private readonly CancellationToken _cancelToken;

    public ApplicationControllerTests(Class4910ApiFactory apiFactory)
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
    public async Task CreateApplication_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response =
            await client.PostAsJsonAsync("Application/1/apply", "test", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateApplication_AsSponsor_ReturnsForbidden()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInSponsor(
            client,
            $"sponsor_apply_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.PostAsJsonAsync("Application/1/apply", "test", _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CreateApplication_AsDriver_ReturnsOkOrBadRequest()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_apply_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.PostAsJsonAsync("Application/1/apply", "test message", _cancelToken);

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected OK or BadRequest but got {response.StatusCode}");
    }

    [Fact]
    public async Task ChangeApplicationStatus_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response =
            await client.PostAsync("Application/1/status?newStatus=Approved", null, _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ChangeApplicationStatus_AsDriver_ReturnsForbidden()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_status_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.PostAsync("Application/1/status?newStatus=Approved", null, _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task ChangeApplicationStatus_AsSponsor_BadId_ReturnsBadRequest()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInSponsor(
            client,
            $"sponsor_status_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.PostAsync("Application/999999/status?newStatus=Approved", null, _cancelToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetApplications_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response = await client.GetAsync("Application", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetApplications_AsDriver_ReturnsOk()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_get_apps_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Application", _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        List<DriverApplication>? apps =
            await ApiHelper.GetClassFromResponse<List<DriverApplication>>(response, _cancelToken);

        Assert.NotNull(apps);
    }

    [Fact]
    public async Task GetApplications_AsSponsor_ReturnsOk()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInSponsor(
            client,
            $"sponsor_get_apps_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Application", _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetApplications_AsAdmin_ReturnsOk()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInAdmin(
            client,
            $"admin_get_apps_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Application", _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetApplications_WithOrgIdWithoutAccess_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_org_apps_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.GetAsync("Application?orgId=1", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task WithdrawApplication_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response =
            await client.DeleteAsync("Application/1", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task WithdrawApplication_AsSponsor_ReturnsForbidden()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInSponsor(
            client,
            $"sponsor_withdraw_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.DeleteAsync("Application/1", _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task WithdrawApplication_AsDriver_BadId_ReturnsBadRequest()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_withdraw_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.DeleteAsync("Application/999999", _cancelToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}