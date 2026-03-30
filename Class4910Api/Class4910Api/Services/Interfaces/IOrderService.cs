using Class4910Api.Models;
namespace Class4910Api.Services.Interfaces
{
    public interface IOrderService
    {
        public Task<int> CreateOrderAsync(CreateOrderRequest request);
        public Task<List<OrderResponse>> GetOrdersByDriverIdAsync(int driverId);
    }
}
