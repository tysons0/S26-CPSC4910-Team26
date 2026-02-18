using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;

public class EbayService : IEbayService
{
    private readonly HttpClient _httpClient;
    private readonly EbayConfig _config;
    private readonly ILogger<EbayService> _logger;
    private readonly JsonSerializerOptions _serializerOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

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

    public async Task<EbaySearchResponse> SearchProductsAsync(string keyword, int limit = 12)
    {
        try
        {
            string token = await GetAccessToken();

            string searchUrl = $"{_config.BaseUrl}/buy/browse/v1/item_summary/search?q={Uri.EscapeDataString(keyword)}&limit={limit}";

            HttpRequestMessage request = new(HttpMethod.Get, searchUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("X-EBAY-C-MARKETPLACE-ID", _config.MarketplaceId);

            HttpResponseMessage response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            string content = await response.Content.ReadAsStringAsync();

            EbayApiResponse? searchResponse = JsonSerializer.Deserialize<EbayApiResponse>(content, _serializerOptions);

            List<EbayProduct> products = [];

            if (searchResponse?.ItemSummaries != null)
            {
                foreach (var item in searchResponse.ItemSummaries)
                {
                    products.Add(new EbayProduct
                    {
                        Name = item.Title ?? "Unknown Product",
                        Points = (int)Math.Round(decimal.Parse(item.Price?.Value ?? "0") * 10),
                        Image = item.Image?.ImageUrl ?? item.ThumbnailImages?[0]?.ImageUrl ?? "",
                        Description = item.ShortDescription ?? "",
                        Price = decimal.Parse(item.Price?.Value ?? "0"),
                        Currency = item.Price?.Currency ?? "USD",
                        ItemId = item.ItemId ?? "",
                        ItemWebUrl = item.ItemWebUrl ?? "",
                        Condition = item.Condition ?? ""
                    });
                }
            }

            _logger.LogInformation("eBay search for '{Keyword}' returned {Count} products", keyword, products.Count);

            return new EbaySearchResponse
            {
                Products = products,
                Total = searchResponse?.Total ?? 0
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "eBay product search failed for keyword: {Keyword}", keyword);
            throw new Exception($"eBay product search failed: {ex.Message}");
        }
    }
}