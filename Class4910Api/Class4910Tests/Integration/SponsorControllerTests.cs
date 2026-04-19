using System.Net;
using Class4910Api.Models;
using Class4910Tests.Integration.Generic;

namespace Class4910Tests.Integration;

public class SponsorControllerTests : IClassFixture<Class4910ApiFactory>
{
    private readonly Class4910ApiFactory _apiFactory;
    private readonly CancellationToken _cancelToken;

    public SponsorControllerTests(Class4910ApiFactory apiFactory)
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
    public async Task GetSponsors_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response = await client.GetAsync("Sponsor", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetSponsors_AsDriver_ReturnsOk()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_get_sponsors_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Sponsor", _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        List<Sponsor>? sponsors =
            await ApiHelper.GetClassFromResponse<List<Sponsor>>(response, _cancelToken);

        Assert.NotNull(sponsors);
    }

    [Fact]
    public async Task GetSponsors_AsSponsor_ReturnsOk()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInSponsor(
            client,
            $"sponsor_get_sponsors_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Sponsor", _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        List<Sponsor>? sponsors =
            await ApiHelper.GetClassFromResponse<List<Sponsor>>(response, _cancelToken);

        Assert.NotNull(sponsors);
    }

    [Fact]
    public async Task GetSponsors_AsAdmin_ReturnsOk()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInAdmin(
            client,
            $"admin_get_sponsors_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Sponsor", _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        List<Sponsor>? sponsors =
            await ApiHelper.GetClassFromResponse<List<Sponsor>>(response, _cancelToken);

        Assert.NotNull(sponsors);
    }

    [Fact]
    public async Task GetCurrentSponsor_WithoutAuth_ReturnsUnauthorized()
    {
        HttpClient client = CreateClient();

        HttpResponseMessage response = await client.GetAsync("Sponsor/me", _cancelToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetCurrentSponsor_AsDriver_ReturnsForbidden()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInDriver(
            client,
            $"driver_current_sponsor_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Sponsor/me", _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetCurrentSponsor_AsAdmin_ReturnsForbidden()
    {
        HttpClient client = CreateClient();

        await GenericAuthActions.CreateLoggedInAdmin(
            client,
            $"admin_current_sponsor_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Sponsor/me", _cancelToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetCurrentSponsor_AsSponsor_ReturnsOk()
    {
        HttpClient client = CreateClient();

        (_, _, Sponsor registeredSponsor) = await GenericAuthActions.CreateLoggedInSponsor(
            client,
            $"sponsor_me_{Guid.NewGuid():N}",
            _cancelToken);

        HttpResponseMessage response = await client.GetAsync("Sponsor/me", _cancelToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        Sponsor? sponsor =
            await ApiHelper.GetClassFromResponse<Sponsor>(response, _cancelToken);

        Assert.NotNull(sponsor);
        Assert.Equal(registeredSponsor.SponsorId, sponsor!.SponsorId);
    }
}