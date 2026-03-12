namespace Class4910Api.Models;

public class DriverWishlist
{
    public int WishlistID { get; set; }
    public int DriverID { get; set; }
    public int OrgID { get; set; }
    public int CatalogItemID { get; set; }
    public DateTime CreatedAt { get; set; }
}
public class DriverWishlistItem
{
    public int WishlistID { get; set; }
    public int CatalogItemID { get; set; }
    public int Points { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? ImageURL { get; set; }
    public string? ItemWebURL { get; set; }
    public decimal LastKnownPrice { get; set; }
    public string? Currency { get; set; }
    public string? ItemCondition { get; set; }
}
