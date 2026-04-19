using System.Net;
using System.Net.Http.Json;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Tests.Integration.Generic;

namespace Class4910Tests.Integration;

public class OrganizationControllerTests : IClassFixture<Class4910ApiFactory>
{
    private readonly Class4910ApiFactory _apiFactory;
    private readonly CancellationToken _cancelToken;

    public OrganizationControllerTests(Class4910ApiFactory apiFactory)
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
    public async Task GetOrganizations_WithAuth_ReturnsOk()
    {
        HttpClient client = CreateClient();
        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_orgs_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Organization", _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        List<Organization>? organizations =
            await ApiHelper.GetClassFromResponse<List<Organization>>(response, _cancelToken);

        Assert.NotNull(organizations);
    }

    [Fact]
    public async Task GetOrganizations_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response = await client.GetAsync("Organization", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateOrganization_AsAdmin_ReturnsOk()
    {
        HttpClient client = CreateClient();
        await GenericAuthActions.CreateLoggedInAdmin(
            client,
            $"admin_create_org_{Guid.NewGuid():N}",
            _cancelToken);

        OrganizationCreationRequest request = new()
        {
            Name = $"Org_{Guid.NewGuid():N}"
        };

        HttpResponseMessage response =
            await client.PostAsJsonAsync("Organization", request, _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        Organization? organization =
            await ApiHelper.GetClassFromResponse<Organization>(response, _cancelToken);

        Assert.NotNull(organization);
        Assert.Equal(request.Name, organization!.Name);
    }

    [Fact]
    public async Task CreateOrganization_AsDriver_ReturnsForbidden()
    {
        HttpClient client = CreateClient();
        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_create_org_{Guid.NewGuid():N}",
            _cancelToken);

        OrganizationCreationRequest request = new()
        {
            Name = $"Org_{Guid.NewGuid():N}"
        };

        HttpResponseMessage response =
            await client.PostAsJsonAsync("Organization", request, _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CreateOrganization_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        OrganizationCreationRequest request = new()
        {
            Name = $"Org_{Guid.NewGuid():N}"
        };

        HttpResponseMessage response =
            await client.PostAsJsonAsync("Organization", request, _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateOrganization_DuplicateName_ReturnsBadRequest()
    {
        HttpClient client = CreateClient();
        await GenericAuthActions.CreateLoggedInAdmin(
            client,
            $"admin_duplicate_org_{Guid.NewGuid():N}",
            _cancelToken);

        string orgName = $"Org_{Guid.NewGuid():N}";

        OrganizationCreationRequest firstRequest = new()
        {
            Name = orgName
        };

        OrganizationCreationRequest secondRequest = new()
        {
            Name = orgName
        };

        HttpResponseMessage firstResponse =
            await client.PostAsJsonAsync("Organization", firstRequest, _cancelToken);

        HttpResponseMessage secondResponse =
            await client.PostAsJsonAsync("Organization", secondRequest, _cancelToken);

        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, secondResponse.StatusCode);
    }

    [Fact]
    public async Task GetOrganizationContext_AsDriver_ReturnsBadRequest()
    {
        HttpClient client = CreateClient();
        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_org_me_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Organization/me", _cancelToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetOrganizationContext_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response = await client.GetAsync("Organization/me", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetOrganizationById_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response = await client.GetAsync("Organization/1", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetOrganizationById_AsDriverWithoutAccess_ReturnsForbidden()
    {
        HttpClient client = CreateClient();
        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_org_forbid_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Organization/1", _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetDriversFromOrganization_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response =
            await client.GetAsync("Organization/drivers?orgId=1", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetDriversFromOrganization_AsDriverWithoutAccess_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();
        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_org_drivers_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.GetAsync("Organization/drivers?orgId=1", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetSponsorsByOrganization_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response =
            await client.GetAsync("Organization/sponsors?orgId=1", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetSponsorsByOrganization_AsDriverWithoutAccess_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();
        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_org_sponsors_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.GetAsync("Organization/sponsors?orgId=1", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task RemoveDriverFromOrganization_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response =
            await client.DeleteAsync("Organization/remove-driver/1?orgId=1", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task RemoveDriverFromOrganization_BadDriverId_ReturnsNotFound()
    {
        HttpClient client = CreateClient();
        await GenericAuthActions.CreateLoggedInAdmin(
            client,
            $"admin_remove_driver_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.DeleteAsync("Organization/remove-driver/999999?orgId=1", _cancelToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task AddDriverToOrganization_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response =
            await client.PostAsync("Organization/add-driver/1?orgId=1", null, _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AddDriverToOrganization_AsDriver_ReturnsForbidden()
    {
        HttpClient client = CreateClient();
        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_add_to_org_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.PostAsync("Organization/add-driver/1?orgId=1", null, _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AddDriverToOrganization_BadDriverId_ReturnsNotFound()
    {
        HttpClient client = CreateClient();
        await GenericAuthActions.CreateLoggedInAdmin(
            client,
            $"admin_add_to_org_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response =
            await client.PostAsync("Organization/add-driver/999999?orgId=1", null, _cancelToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}