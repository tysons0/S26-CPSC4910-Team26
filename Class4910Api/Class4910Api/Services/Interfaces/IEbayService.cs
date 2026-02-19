using Class4910Api.Models;

namespace Class4910Api.Services.Interfaces;

public interface IEbayService
{
    Task<string> GetAccessToken();
    Task<EbaySearchResponse> SearchProductsAsync(string keyword, int limit = 12);
    Task<EbayProduct> GetProductbyIDAsync(string itemID};
}

