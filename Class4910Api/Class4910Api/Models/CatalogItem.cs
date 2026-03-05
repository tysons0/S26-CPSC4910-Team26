namespace Class4910Api.Models;

public class CatalogItem
{
    public int CatalogItemID { get; set; }
    public string EbayItemId { get; set; } = null!;
    public string Title { get; set; }
    public string Description { get; set; }
    public string ImageUrl { get; set; }
    public string ItemWebUrl { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; }
    public string Condition { get; set; }
    public int Points { get; set; }
    public bool IsActive { get; set; }
}

