namespace Class4910Api.Models
{
    public class CreateOrderRequest
    {
        public int DriverId { get; set; }
        public int OrgId { get; set; }
        public int ShippingAddressId { get; set; }
        public List<OrderItemRequest> Items { get; set; }

    }
    public class OrderItemRequest
    {
        public int CatalogItemId { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class CreateOrderResponse
    {
        public int OrderId { get; set; }
        public int TotalPointsSpent { get; set; }
        public string Status { get; set; }
    }

    public class OrderResponse
    {
        public int OrderId { get; set; }
        public int DriverId { get; set; }
        public string Status { get; set; } = string.Empty;
        public int TotalPoints { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<OrderItemResponse> Items { get; set; } = new();

    }
    public class OrderItemResponse
    {
        public int OrderItemId { get; set; }
        public int CatalogItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? ItemImageUrl { get; set; }
        public int Quantity { get; set; }
        public int PointsAtPurchase { get; set; }
    }
}