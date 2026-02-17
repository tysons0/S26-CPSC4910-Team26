namespace Class4910Api.Configuration;

public class EbayConfig
{
    public required string ClientId { get; init; }
    public required string ClientSecret { get; init; }
    public string BaseUrl { get; init; } = "https://api.sandbox.ebay.com";
    public string MarketplaceId { get; init; } = "EBAY_US";
}
