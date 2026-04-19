using System.Net.Http.Json;
using Class4910Api;
using Class4910Api.Models;
using Class4910Api.Models.Requests;

namespace Class4910Tests.Integration.Generic;

public static class GenericAuthActions
{
    public async static Task<LoginResult?> Login(HttpClient client, UserRequest request, CancellationToken cancelToken)
    {
        HttpResponseMessage response = await client.PostAsJsonAsync("Auth/login", request, cancelToken);
        return await ApiHelper.GetClassFromResponse<LoginResult>(response, cancelToken);
    }

    public async static Task<Driver?> RegisterDriver(HttpClient client, UserRequest request, CancellationToken cancelToken)
    {
        HttpResponseMessage response = await client.PostAsJsonAsync("Auth/register/driver", request, cancelToken);
        return await ApiHelper.GetClassFromResponse<Driver>(response, cancelToken);
    }

    public async static Task<Sponsor?> RegisterSponsor(HttpClient client, UserRequest request, CancellationToken cancelToken)
    {
        LoginResult? loginResult = await Login(client, ConstantValues.seedAdminRequest, cancelToken);
        AttachBearer(client, loginResult?.Token ?? "");

        HttpResponseMessage response = await client.PostAsJsonAsync("Auth/register/sponsor", request, cancelToken);
        return await ApiHelper.GetClassFromResponse<Sponsor>(response, cancelToken);
    }

    public async static Task<Admin?> RegisterAdmin(HttpClient client, UserRequest request, CancellationToken cancelToken)
    {
        LoginResult? loginResult = await Login(client, ConstantValues.seedAdminRequest, cancelToken);
        AttachBearer(client, loginResult?.Token ?? "");

        HttpResponseMessage response = await client.PostAsJsonAsync("Auth/register/admin", request, cancelToken);
        return await ApiHelper.GetClassFromResponse<Admin>(response, cancelToken);
    }

    public static HttpClient AttachBearer(HttpClient client, string? token)
    {
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token ?? "");
        return client;
    }

    public async static Task<(HttpClient Client, LoginResult Login, Driver Driver)> CreateLoggedInDriver(HttpClient client, string username, CancellationToken cancelToken)
    {
        UserRequest request = BuildUserRequest(username);
        Driver? driver = await RegisterDriver(client, request, cancelToken);
        Assert.NotNull(driver);

        LoginResult? login = await Login(client, request, cancelToken);
        Assert.NotNull(login);
        Assert.False(string.IsNullOrWhiteSpace(login!.Token));

        AttachBearer(client, login.Token);

        return (client, login, driver);
    }

    public async static Task<(HttpClient Client, LoginResult Login, Sponsor Sponsor)> CreateLoggedInSponsor(HttpClient client, string username, CancellationToken cancelToken)
    {
        UserRequest request = BuildUserRequest(username);
        Sponsor? sponsor = await RegisterSponsor(client, request, cancelToken);
        Assert.NotNull(sponsor);

        LoginResult? login = await Login(client, request, cancelToken);
        Assert.NotNull(login);
        Assert.False(string.IsNullOrWhiteSpace(login!.Token));

        AttachBearer(client, login.Token);

        return (client, login, sponsor);
    }

    public async static Task<(HttpClient Client, LoginResult Login, Admin Admin)> CreateLoggedInAdmin(HttpClient client, string username, CancellationToken cancelToken)
    {

        UserRequest request = BuildUserRequest(username);
        Admin? admin = await RegisterAdmin(client, request, cancelToken);
        Assert.NotNull(admin);

        LoginResult? login = await Login(client, request, cancelToken);
        Assert.NotNull(login);
        Assert.False(string.IsNullOrWhiteSpace(login!.Token));

        AttachBearer(client, login.Token);

        return (client, login, admin);
    }

    public static UserRequest BuildUserRequest(string username, string password = "Test123!")
    {
        return new UserRequest
        {
            UserName = username,
            Password = password
        };
    }
}
