namespace Class4910Api.Models
{
    public class EbayProduct
    {
        public string? Name { get; set; }
        public int Points { get; set; }
        public string? Image { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? Currency { get; set; }
        public string? ItemId { get; set; }
        public string? ItemWebUrl { get; set; }
        public string? Condition { get; set; }
    }

    public class EbaySearchResponse
    {
        public List<EbayProduct>? Products { get; set; }
        public int Total { get; set; }
    }

    internal class EbayApiResponse
    {
        public List<EbayItemSummary>? ItemSummaries { get; set; }
        public int Total { get; set; }
    }

    internal class EbayItemSummary
    {
        public string? ItemId { get; set; }
        public string? Title { get; set; }
        public EbayImage? Image { get; set; }
        public List<EbayImage>? ThumbnailImages { get; set; }
        public EbayPrice? Price { get; set; }
        public string? ShortDescription { get; set; }
        public string? ItemWebUrl { get; set; }
        public string? Condition { get; set; }
    }

    internal class EbayImage
    {
        public string? ImageUrl { get; set; }
    }

    internal class EbayPrice
    {
        public string Value { get; set; }
        public string? Currency { get; set; }
    }
}