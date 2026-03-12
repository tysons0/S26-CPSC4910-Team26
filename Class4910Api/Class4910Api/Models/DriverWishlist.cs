namespace Class4910Api.Models;

public class DriverWishlist
{
    public int WishlistID { get; set; }
    public int DriverID { get; set; }
    public int OrgID { get; set; }
    public int CatalogItemID { get; set; }
    public DateTime CreatedAt { get; set; }
}
