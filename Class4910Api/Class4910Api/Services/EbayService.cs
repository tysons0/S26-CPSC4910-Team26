using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Class4910Api.Configuration;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;

public class EbayService : IEbayService
{
    private readonly HttpClient _httpClient;
    private readonly EbayConfig _config;
    private readonly ILogger<EbayService> _logger;

    private string? _accessToken;
    private DateTime _tokenExpiry;

    public EbayService(HttpClient httpClient, IOptions<EbayConfig> ebayConfig, ILogger<EbayService> logger)
    {
        _httpClient = httpClient;
        _config = ebayConfig.Value;
        _logger = logger;
    }

    public async Task<string> GetAccessToken()
    {
        if (_accessToken != null && DateTime.UtcNow < _tokenExpiry)
        {
            return _accessToken;
        }

        string clientId = _config.ClientId;
        string clientSecret = _config.ClientSecret;

        string auth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));

        HttpRequestMessage request = new(HttpMethod.Post, "https://api.sandbox.ebay.com/identity/v1/oauth2/token");
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", auth);
        request.Content = new StringContent("grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope", Encoding.UTF8, "application/x-www-form-urlencoded");

        HttpResponseMessage respone = await _httpClient.SendAsync(request);
        respone.EnsureSuccessStatusCode();
        
        string json = await respone.Content.ReadAsStringAsync();
        JsonDocument doc = JsonDocument.Parse(json);

        _accessToken = doc.RootElement.GetProperty("access_token").GetString();
        int expiresIn = doc.RootElement.GetProperty("expires_in").GetInt32();
        _tokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn - 60); // Refresh a minute before expiry

        return _accessToken!;
    }
}