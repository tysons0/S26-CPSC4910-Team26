using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static Class4910Api.ConstantValues;


namespace Class4910Api.Controllers;

[ApiController]
[Route("[controller]")]
public class OrderController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IContextService _contextService;

    public OrderController(IOrderService orderService, IContextService contextService)
    {
        _orderService = orderService;
        _contextService = contextService;
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var orderId = await _orderService.CreateOrderAsync(request);
        return Ok(new { OrderId = orderId });
    }

    [Authorize]
    [HttpGet("/driver/{driverId}")]
    public async Task<IActionResult> GetOrdersByDriver(int driverId)
    {
        try
        {
            var orders = await _orderService.GetOrdersByDriverIdAsync(driverId);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

