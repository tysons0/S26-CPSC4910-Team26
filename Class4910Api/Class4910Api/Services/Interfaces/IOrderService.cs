using Class4910Api.Models;
namespace Class4910Api.Services.Interfaces
{
    public interface IOrderService
    {
        public Task<int> CreateOrderAsync(CreateOrderRequest request);
        public Task<List<OrderResponse>> GetOrdersByDriverIdAsync(int driverId);
        public Task<List<OrderResponse>> GetOrdersByOrgIdAsync(int orgId);
        public Task<bool> UpdateOrderStatusAsync(int orderId, int driverId, string newStatus);
    }
}
