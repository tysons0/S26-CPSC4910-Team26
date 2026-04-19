using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace Class4910Tests.Integration.Generic;

public static class ApiHelper
{
    public async static Task<T?> GetClassFromResponse<T>(HttpResponseMessage response, CancellationToken cancelToken)
        where T : class
    {
        if (response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Created)
        {
            return await response.Content.ReadFromJsonAsync<T>(cancelToken);
        }

        return null;
    }

    public static HttpClient AttachTokenToClient(HttpClient client, string? token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token ?? "");
        return client;
    }
}
