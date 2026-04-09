using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static Class4910Api.ConstantValues;


namespace Class4910Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class OrderController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IContextService _contextService;
    private readonly IDriverService _driverService;

    public OrderController(IOrderService orderService, IContextService contextService, IDriverService driverService)
    {
        _orderService = orderService;
        _contextService = contextService;
        _driverService = driverService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var orderId = await _orderService.CreateOrderAsync(request);
        return Ok(new { OrderId = orderId });
    }

    [HttpGet("driver/{driverId}")]
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
    [HttpGet("organization/{orgId}")]
    public async Task<IActionResult> GetOrdersByOrg(int orgId)
    {
        try
        {
            var orders = await _orderService.GetOrdersByOrgIdAsync(orgId);
            return Ok(orders);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });

        }
    }
    
    [HttpPatch("{orderId}")]
    public async Task<IActionResult> CancelOrder(int orderId, [FromBody] UpdateOrderStatusRequest request)
    {
        try
        {
            var userId = _contextService.GetUserId(HttpContext);
            Driver? driver = await _driverService.GetDriverByUserId(userId);
            if (driver == null)
            {
                return BadRequest(new { message = "Driver not found" });
            }
            var success = await _orderService.UpdateOrderStatusAsync(orderId, driver.DriverId, request.Status);
            if (!success)
            {
                return BadRequest(new { message = "Failed to update order" });
            }

            return Ok(new { message = "Order status updated successfully" });

        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }

    }

}

