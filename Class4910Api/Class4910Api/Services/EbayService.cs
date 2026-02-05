
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
public class EbayService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;

    private string? _accessToken;
    private DateTime _tokenExpiry;
    public EbayService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _config = config;
    }
    public async Task<string> GetAccessToken()
    {
        if (_accessToken != null && DateTime.UtcNow < _tokenExpiry)
        {
            return _accessToken;
        }

        var clientId = _config["Ebay:ClientId"];
        var clientSecret = _config["Ebay:ClientSecret"];

        var auth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.sandbox.ebay.com/identity/v1/oauth2/token");
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", auth);
        request.Content = new StringContent("grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope", Encoding.UTF8, "application/x-www-form-urlencoded");

        var respone = await _httpClient.SendAsync(request);
        respone.EnsureSuccessStatusCode();
        
        var json = await respone.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        _accessToken = doc.RootElement.GetProperty("access_token").GetString();
        var expiresIn = doc.RootElement.GetProperty("expires_in").GetInt32();
        _tokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn - 60); // Refresh a minute before expiry

        return _accessToken!;
    }
}