namespace Class4910Api.Models.Requests;

public class AddCatalogItemRequest
{
    public string EbayItemId { get; set; } = null!;
    public int Points { get; set; }
}
