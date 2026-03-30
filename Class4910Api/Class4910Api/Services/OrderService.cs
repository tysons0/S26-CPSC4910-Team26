using Class4910Api.Services.Interfaces;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Configuration;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;

namespace Class4910Api.Services
{
    public class OrderService : IOrderService
    {
        private readonly string _dbConnection;
        private readonly IDriverService _driverService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<OrderService> _logger;


        public OrderService(IOptions<DatabaseConnection> dbConnection, ILogger<OrderService> logger, 
                            IDriverService driverService, INotificationService notificationService)
        {
            _dbConnection = dbConnection.Value.Connection;
            _logger = logger;
            _driverService = driverService;
            _notificationService = notificationService;
        }

        public async Task<int> CreateOrderAsync(CreateOrderRequest request)
        {
            using MySqlConnection conn = new(_dbConnection);
            await conn.OpenAsync();

            using var transaction = await conn.BeginTransactionAsync();

            try
            {
                string driverSql = @"SELECT Points FROM Drivers WHERE DriverId = @DriverId AND OrgId = @OrgId";
                using var driverCmd = new MySqlCommand(driverSql, conn, (MySqlTransaction)transaction);
                driverCmd.Parameters.AddWithValue("@DriverId", request.DriverId);
                driverCmd.Parameters.AddWithValue("@OrgId", request.OrgId);

                var driverPointsObj = await driverCmd.ExecuteScalarAsync();
                if (driverPointsObj == null) throw new Exception("Driver not found");

                int driverPoints = Convert.ToInt32(driverPointsObj);
                int totalPoints = 0;

                foreach (var item in request.Items)
                {
                    string pointsSql = @"SELECT Points FROM SponsorCatalogItems WHERE CatalogItemID = @CatalogItemID";
                    using var pointsCmd = new MySqlCommand(pointsSql, conn, (MySqlTransaction)transaction);
                    pointsCmd.Parameters.AddWithValue("@CatalogItemID", item.CatalogItemId);

                    var pointsObj = await pointsCmd.ExecuteScalarAsync();
                    if (pointsObj == null)
                    {
                        throw new Exception("Invalid catalog item.");
                    }
                    int points = Convert.ToInt32(pointsObj);
                    totalPoints += points * item.Quantity;
                }
                if (driverPoints < totalPoints)
                {
                    throw new Exception("Insufficient points.");
                }

                string updateDriverSql = @"UPDATE Drivers SET Points = Points - @Points WHERE DriverId = @DriverId";
                using var updateDriverCmd = new MySqlCommand(updateDriverSql, conn, (MySqlTransaction)transaction);
                updateDriverCmd.Parameters.AddWithValue("@Points", totalPoints);
                updateDriverCmd.Parameters.AddWithValue("@DriverId", request.DriverId);

                await updateDriverCmd.ExecuteNonQueryAsync();

                string orderSql = @"INSERT INTO Orders (DriverId, OrgId, TotalPointsSpent, OrderStatus, ShippingAddressId, CreatedAtUTC) 
                                VALUES (@DriverId, @OrgId, @TotalPointsSpent, 'Pending', @ShippingAddressId, UTC_TIMESTAMP());
                                SELECT LAST_INSERT_ID();";
                using var orderCmd = new MySqlCommand(orderSql, conn, (MySqlTransaction)transaction);
                orderCmd.Parameters.AddWithValue("@DriverId", request.DriverId);
                orderCmd.Parameters.AddWithValue("@OrgId", request.OrgId);
                orderCmd.Parameters.AddWithValue("@TotalPointsSpent", totalPoints);
                orderCmd.Parameters.AddWithValue("@ShippingAddressId", request.ShippingAddressId);

                int orderId = Convert.ToInt32(await orderCmd.ExecuteScalarAsync());

                foreach (var item in request.Items)
                {
                    string itemSql = @"
                    INSERT INTO OrderItems 
                    (OrderId, CatalogItemId,
                    EbayItemID, ItemName,
                    ItemImageURL,
                    Quantity, PointsAtPurchase, 
                    CreatedAtUTC
                    )
                    SELECT
                        @OrderId,
                        c.CatalogItemID,c.EbayItemID,
                        e.Name, e.ImageURL,
                        @Quantity, c.Points,
                        UTC_TIMESTAMP()
                    FROM SponsorCatalogItems c
                    INNER JOIN EbayItems e ON e.EbayItemID = c.EbayItemID
                    WHERE c.CatalogItemID = @CatalogItemID;";

                    using var itemCmd = new MySqlCommand(itemSql, conn, (MySqlTransaction)transaction);
                    itemCmd.Parameters.AddWithValue("@OrderId", orderId);
                    itemCmd.Parameters.AddWithValue("@CatalogItemID", item.CatalogItemId);
                    itemCmd.Parameters.AddWithValue("@Quantity", item.Quantity);

                    int rows = await itemCmd.ExecuteNonQueryAsync();
                    if (rows == 0)
                    {
                        throw new Exception("Failed to insert order item.");
                    }
                }

                PointChangeRequest pointChange = new PointChangeRequest
                {
                    PointChange = -totalPoints,
                    ChangeReason = $"Order #{orderId} placed"
                };
                await _driverService.AddToDriverPointHistory(request.DriverId, null, pointChange);

                await transaction.CommitAsync();


                await _notificationService.CreateNotification(request.DriverId,
                    $"Your order #{orderId} has been placed successfully! Total points spent: {totalPoints}.",
                    NotificationType.PointsChange);

                _logger.LogInformation("Order {OrderId} created for Driver {DriverId} with total points {TotalPoints}", orderId, request.DriverId, totalPoints);
                return orderId;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating order for Driver {DriverId}: {Message}", request.DriverId, ex.Message);
                return -99999;
            }
        }

        public async Task<List<OrderResponse>> GetOrdersByDriverIdAsync(int driverId)
        {
            var orderDict = new Dictionary<int, OrderResponse>();
            _logger.LogInformation("Retrieving orders for Driver {DriverId}", driverId);
            try
            {
                string sql = @"
                    SELECT o.OrderId, o.OrderStatus, o.TotalPointsSpent, o.CreatedAtUTC,
                           oi.OrderItemId, oi.CatalogItemId, oi.ItemName, oi.ItemImageURL, oi.Quantity, oi.PointsAtPurchase
                    FROM Orders o
                    INNER JOIN OrderItems oi ON o.OrderId = oi.OrderId
                    WHERE o.DriverId = @DriverId
                    ORDER BY o.CreatedAtUTC DESC";
                using MySqlConnection conn = new(_dbConnection);
                using MySqlCommand cmd = new(sql, conn);
                cmd.Parameters.AddWithValue("@DriverId", driverId);

                await conn.OpenAsync();
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    int orderId = reader.GetInt32(reader.GetOrdinal("OrderId"));
                    if (!orderDict.ContainsKey(orderId))
                    {
                        orderDict[orderId] = new OrderResponse
                        {
                            OrderId = orderId,
                            Status = reader.GetString(reader.GetOrdinal("OrderStatus")),
                            TotalPoints = reader.GetInt32(reader.GetOrdinal("TotalPointsSpent")),
                            CreatedAt = reader.GetDateTime(reader.GetOrdinal("CreatedAtUTC")),
                            Items = new List<OrderItemResponse>()
                        };
                    }
                    orderDict[orderId].Items.Add(new OrderItemResponse
                    {
                        OrderItemId = reader.GetInt32(reader.GetOrdinal("OrderItemId")),
                        CatalogItemId = reader.GetInt32(reader.GetOrdinal("CatalogItemId")),
                        ItemName = reader.GetString(reader.GetOrdinal("ItemName")),
                        ItemImageUrl = reader.IsDBNull(reader.GetOrdinal("ItemImageURL")) ? null : reader.GetString(reader.GetOrdinal("ItemImageURL")),
                        Quantity = reader.GetInt32(reader.GetOrdinal("Quantity")),
                        PointsAtPurchase = reader.GetInt32(reader.GetOrdinal("PointsAtPurchase"))
                    });
                }
                return orderDict.Values.ToList();
            }
            catch (MySqlException ex)
            {
                _logger.LogError(ex, "Database error while retrieving orders for Driver {DriverId}: {Message}", driverId, ex.Message);
                return [];
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while retrieving orders for Driver {DriverId}: {Message}", driverId, ex.Message);
                return [];
            }
        }
    }
}
