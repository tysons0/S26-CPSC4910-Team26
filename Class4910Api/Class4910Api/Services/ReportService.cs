using System.Data.Common;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Models.Reports;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;

using static Class4910Api.ConstantValues;

namespace Class4910Api.Services;

public class ReportService : IReportService
{
    private readonly ILogger<ReportService> _logger;
    private readonly IDriverService _driverService;
    private readonly ISponsorService _sponsorService;
    private readonly IOrganizationService _organizationService;
    private readonly IEbayService _ebayService;
    private readonly string _dbConnection;

    public ReportService(ILogger<ReportService> logger,
                         IOptions<DatabaseConnection> databaseConnection,
                         IDriverService driverService,
                         ISponsorService sponsorService,
                         IOrganizationService organizationService,
                         IEbayService ebayService)
    {
        _logger = logger;
        _dbConnection = databaseConnection.Value.Connection;
        _driverService = driverService;
        _sponsorService = sponsorService;
        _organizationService = organizationService;
        _ebayService = ebayService;
    }

    public async Task<ReportTable?> GetOrderReport(OrderReportRequest request)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT orders.OrderId as orders_OrderId, items.OrderItemId as items_OrderItemId, items.EbayItemId as items_EbayItemId,
	               orders.DriverId as orders_DriverId, orders.OrgId as orders_OrgId, 
	               orders.OrderStatus as orders_OrderStatus, orders.ShippingAddressId as orders_ShippingAddressId, 
                   orders.TotalPointsSpent as orders_TotalPointsSpent, items.PointsAtPurchase as items_PointsAtPurchase, items.Quantity as items_Quantity,
                   orders.CreatedAtUTC as orders_CreatedAtUtc
                   FROM Orders orders
                   JOIN OrderItems items ON orders.OrderId = items.OrderId
                   WHERE 1=1
                ";

            List<string> conditions = [];

            if (request.DriverId.HasValue)
            {
                conditions.Add("orders.DriverId = @DriverId");
                command.Parameters.AddWithValue("@DriverId", request.DriverId.Value);
            }

            if (request.OrganizationId.HasValue)
            {
                conditions.Add("orders.OrgId = @OrgId");
                command.Parameters.AddWithValue("@OrgId", request.OrganizationId.Value);
            }

            if (request.EbayItemId.HasValue)
            {
                conditions.Add("items.EbayItemId = @EbayItemId");
                command.Parameters.AddWithValue("@EbayItemId", request.EbayItemId.Value);
            }

            if (request.BeforeUtcDate.HasValue)
            {
                conditions.Add("orders.CreatedAtUTC < @BeforeUtcDate");
                command.Parameters.AddWithValue("@BeforeUtcDate", request.BeforeUtcDate.Value);
            }

            if (request.AfterUtcDate.HasValue)
            {
                conditions.Add("orders.CreatedAtUTC > @AfterUtcDate");
                command.Parameters.AddWithValue("@AfterUtcDate", request.AfterUtcDate.Value);
            }

            if (conditions.Count > 0)
            {
                command.CommandText += " AND " + string.Join(" AND ", conditions);
            }

            _logger.LogInformation("Executing Order report query for request[{Request}]: {Query}",
                request, command.CommandText);

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            List<OrderReportItem> orderRecords = [];
            while (await reader.ReadAsync())
            {
                int OrderId = int.Parse(reader["orders_OrderId"].ToString()
                    ?? throw new("Failed to parse OrderId"));
                int OrgId = int.Parse(reader["orders_OrgId"].ToString()
                    ?? throw new("Failed to parse OrgId"));
                int DriverId = int.Parse(reader["orders_DriverId"].ToString()
                    ?? throw new("Failed to parse DriverId"));
                decimal PointsSpent = decimal.Parse(reader["orders_TotalPointsSpent"].ToString()
                    ?? throw new("Failed to parse TotalPointsSpent"));
                DateTime CreatedAtUtc = DateTime.Parse(reader["orders_CreatedAtUtc"].ToString()
                    ?? throw new("Failed to parse CreatedAtUtc"));
                string? EbayItemIdStr = reader["items_EbayItemId"].ToString();
                string? ShippingAddressIdStr = reader["orders_ShippingAddressId"].ToString();
                DriverAddress? ShippingAddress = null;
                EbayProduct? ebayProduct = null;
                if (!string.IsNullOrWhiteSpace(ShippingAddressIdStr))
                {
                    ShippingAddress = await _driverService.GetDriverAddressById(DriverId, int.Parse(ShippingAddressIdStr));
                }
                if (!string.IsNullOrWhiteSpace(EbayItemIdStr))
                {
                    ebayProduct = await _ebayService.GetProductByIDAsync(EbayItemIdStr);
                }
                Driver driver = await _driverService.GetDriverByDriverId(DriverId)
                    ?? throw new($"Failed to get driver[{DriverId}]");
                Organization organization = await _organizationService.GetOrganizationById(OrgId)
                    ?? throw new($"Failed to get organization[{OrgId}]");

                orderRecords.Add(new OrderReportItem()
                {
                    OrderId = OrderId,
                    Organization = organization,
                    Driver = driver,
                    DriverAddress = ShippingAddress,
                    PointsSpent = (int)PointsSpent,
                    OrderDate = CreatedAtUtc,
                    Product = ebayProduct
                });
            }

            _logger.LogInformation("Found {Count} orders for request[{Request}]",
                orderRecords.Count, request);

            return GetOrderReportList(orderRecords);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Orders for request[{Request}]", request);
            return null;
        }
    }

    public async Task<ReportTable?> GetPointHistoryReport(PointHistoryReportRequest request)
    {
        try
        {
            string pointHistoryPrefix = "hist";

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText =
                @$"SELECT {DriverPointHistoryTable.GetFields(pointHistoryPrefix)}, s.OrgId as SponsorOrgId, d.OrgId as DriverOrgId
                   FROM {DriverPointHistoryTable.Name} {pointHistoryPrefix}
                   JOIN {DriversTable.Name} d ON d.{DriverIdField.SelectName} = {pointHistoryPrefix}.{DriverIdField.Name}
                   LEFT JOIN {SponsorsTable.Name} s ON s.{SponsorIdField.SelectName} = {pointHistoryPrefix}.{SponsorIdField.Name}
                   WHERE 1=1 ";
            List<string> conditions = [];

            if (request.DriverId.HasValue)
            {
                conditions.Add($"{pointHistoryPrefix}.DriverId = @DriverId");
                command.Parameters.Add(DriverIdField.GenerateParameter("@DriverId", request.DriverId));
            }
            if (request.SponsorId.HasValue)
            {
                conditions.Add($"{pointHistoryPrefix}.SponsorId = @SponsorId");
                command.Parameters.Add(SponsorIdField.GenerateParameter("@SponsorId", request.SponsorId));
            }
            if (request.OrgId.HasValue)
            {
                conditions.Add($"(s.OrgId = @OrgId OR d.OrgId = @OrgId)");
                command.Parameters.Add(OrgIdField.GenerateParameter("@OrgId", request.OrgId));
            }
            if (!string.IsNullOrEmpty(request.ReasonLike))
            {
                conditions.Add($"{pointHistoryPrefix}.Reason LIKE @ReasonLike");
                command.Parameters.Add(PointHistoryReasonField.GenerateParameter("@ReasonLike", $"%{request.ReasonLike}%"));
            }
            if (request.BeforeUtcDate.HasValue)
            {
                conditions.Add($"{pointHistoryPrefix}.CreatedAtUtc < @BeforeUtcDate");
                command.Parameters.Add(PointHistoryCreatedAtUtcField.GenerateParameter("@BeforeUtcDate", request.BeforeUtcDate.Value));
            }
            if (request.AfterUtcDate.HasValue)
            {
                conditions.Add($"{pointHistoryPrefix}.CreatedAtUtc > @AfterUtcDate");
                command.Parameters.Add(PointHistoryCreatedAtUtcField.GenerateParameter("@AfterUtcDate", request.AfterUtcDate.Value));
            }

            if (conditions.Count > 0)
            {
                command.CommandText += " AND " + string.Join(" AND ", conditions);
            }

            if (request.SortOptions.Any())
            {
                List<string> orderClauses = [];
                foreach (PointHistorySortOption sortOption in request.SortOptions)
                {
                    orderClauses.Add($"{pointHistoryPrefix}.{sortOption.Field} {sortOption.Direction}");
                }
                command.CommandText += " ORDER BY " + string.Join(", ", orderClauses);
            }

            _logger.LogInformation("Executing Point History report query for request[{Request}]: {Query}",
                request, command.CommandText);
            await using DbDataReader reader = await command.ExecuteReaderAsync();

            List<PointHistoryReportItem> historyRecords = [];
            while (await reader.ReadAsync())
            {
                PointHistoryRecord record = await _driverService.GetPointHistoryRecordFromReader(reader, pointHistoryPrefix);
                Sponsor? recordSponsor = null;
                if (record.SponsorId is not null)
                    recordSponsor = await _sponsorService.GetSponsorBySponsorId((int)record.SponsorId);
                Driver driver = await _driverService.GetDriverByDriverId(record.DriverId)
                    ?? throw new($"Failed to get driver[{record.DriverId}]");

                historyRecords.Add(new PointHistoryReportItem()
                {
                    Driver = driver,
                    Sponsor = recordSponsor,

                    PointChange = record.PointChange,
                    Reason = record.Reason,
                    CreatedAtUtc = record.CreatedAtUtc
                });
            }

            _logger.LogInformation("Found {Count} point history records for request[{Request}]",
                historyRecords.Count, request);

            return GetReportPointHistoryList(historyRecords);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Point History records for request[{Request}]", request);
            return null;
        }
    }

    public async Task<ReportTable?> GetAuditLogReport(AuditLogReportRequest request)
    {
        try
        {
            await using MySqlConnection conn = new(_dbConnection);
            await conn.OpenAsync();

            MySqlCommand command = conn.CreateCommand();

            List<string> unionQueries = [];

            bool includePasswordChanges = request.Type == LogType.All || request.Type == LogType.PasswordChanges;
            bool includeLoginAttempts = request.Type == LogType.All || request.Type == LogType.LoginAttempts;
            bool includeApplications = request.Type == LogType.All || request.Type == LogType.Applications;

            if (includePasswordChanges)
            {
                unionQueries.Add(
                    @"SELECT
                    'Password Change' AS LogCategory,
                    pc.ChangeDateUtc AS EventUtc,
                    u.UserId AS UserId,
                    u.UserName AS UserName,
                    NULL AS OrgId,
                    NULL AS SponsorId,
                    'Password changed' AS Details
                  FROM PasswordChanges pc
                  JOIN Users u ON u.UserId = pc.UserId
                  WHERE 1=1
                    AND (@UserId IS NULL OR u.UserId = @UserId)");
            }

            if (includeLoginAttempts)
            {
                unionQueries.Add(
                    @"SELECT
                    'Login Attempt' AS LogCategory,
                    la.LoginDate AS EventUtc,
                    u.UserId AS UserId,
                    la.UserName AS UserName,
                    NULL AS OrgId,
                    NULL AS SponsorId,
                    CONCAT('Status: ', la.LoginStatus, ', IP: ', la.LoginIP) AS Details
                  FROM LoginAttempts la
                  LEFT JOIN Users u ON u.UserName = la.UserName
                  WHERE 1=1
                    AND (@UserId IS NULL OR u.UserId = @UserId)");
            }

            if (includeApplications)
            {
                unionQueries.Add(
                    @"SELECT
                    'Application' AS LogCategory,
                    da.CreatedAtUtc AS EventUtc,
                    du.UserId AS UserId,
                    uu.UserName AS UserName,
                    da.OrgId AS OrgId,
                    da.SponsorId AS SponsorId,
                    CONCAT(
                        'Status: ', da.ApplicationStatus,
                        CASE
                            WHEN da.ChangeReason IS NOT NULL AND da.ChangeReason <> ''
                                THEN CONCAT(', Reason: ', da.ChangeReason)
                            WHEN da.DriverMessage IS NOT NULL AND da.DriverMessage <> ''
                                THEN CONCAT(', Message: ', da.DriverMessage)
                            ELSE ''
                        END
                    ) AS Details
                  FROM DriverApplications da
                  JOIN Drivers du ON du.DriverId = da.DriverId
                  JOIN Users uu ON uu.UserId = du.UserId
                  WHERE 1=1
                    AND (@UserId IS NULL OR du.UserId = @UserId)
                    AND (@OrgId IS NULL OR da.OrgId = @OrgId)
                    AND (@SponsorId IS NULL OR da.SponsorId = @SponsorId)");
            }

            if (unionQueries.Count == 0)
            {
                _logger.LogWarning("No audit log query sections were selected for request[{Request}]", request);
                return new ReportTable
                {
                    Headers = ["Category", "Event UTC", "User ID", "Username", "Org ID", "Sponsor ID", "Details"],
                    Rows = []
                };
            }

            command.CommandText = string.Join(" UNION ALL ", unionQueries) + " ORDER BY EventUtc DESC";

            command.Parameters.AddWithValue("@UserId", request.UserId.HasValue ? request.UserId.Value : DBNull.Value);
            command.Parameters.AddWithValue("@OrgId", request.OrgId.HasValue ? request.OrgId.Value : DBNull.Value);
            command.Parameters.AddWithValue("@SponsorId", request.SponsorId.HasValue ? request.SponsorId.Value : DBNull.Value);

            _logger.LogInformation("Executing Audit Log report query for request[{Request}]: {Query}",
                request, command.CommandText);

            await using DbDataReader reader = await command.ExecuteReaderAsync();

            List<List<object>> rows = [];
            while (await reader.ReadAsync())
            {
                rows.Add(
                [
                    reader["LogCategory"]?.ToString() ?? "N/A",
                    reader["EventUtc"] is DBNull ? "N/A" : Convert.ToDateTime(reader["EventUtc"]),
                    reader["UserId"] is DBNull ? "N/A" : Convert.ToInt32(reader["UserId"]),
                    reader["UserName"]?.ToString() ?? "N/A",
                    reader["OrgId"] is DBNull ? "N/A" : Convert.ToInt32(reader["OrgId"]),
                    reader["SponsorId"] is DBNull ? "N/A" : Convert.ToInt32(reader["SponsorId"]),
                    reader["Details"]?.ToString() ?? "N/A"
                ]);
            }

            _logger.LogInformation("Found {Count} audit log records for request[{Request}]",
                rows.Count, request);

            return new ReportTable
            {
                Headers =
                [
                    "Category",
                    "Event UTC",
                    "User ID",
                    "Username",
                    "Org ID",
                    "Sponsor ID",
                    "Details"
                ],
                Rows = rows
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Audit Log records for request[{Request}]", request);
            return null;
        }
    }

    private static ReportTable GetReportPointHistoryList(List<PointHistoryReportItem> historyRecords)
    {
        List<string> headers = ["Driver ID", "Driver Name", "Sponsor ID", "Sponsor Name", "Point Change", "Reason", "Created At (UTC)"];
        List<List<object>> rows = [];

        foreach (PointHistoryReportItem record in historyRecords)
        {
            rows.Add(
            [
                record.Driver.DriverId,
                record.Driver.UserData.Username,
                record.Sponsor?.SponsorId.ToString() ?? "N/A",
                record.Sponsor?.UserData.Username ?? "N/A",
                record.PointChange,
                record.Reason,
                record.CreatedAtUtc
            ]);
        }

        return new()
        {
            Headers = headers,
            Rows = rows
        };
    }

    private static ReportTable GetOrderReportList(List<OrderReportItem> orderItems)
    {
        List<string> headers =
        [
            "Order ID",
            "Driver ID",
            "Driver Name",
            "Organization ID",
            "Organization Name",
            "Product Name",
            "Product Item ID",
            "Points Spent",
            "Order Date (UTC)",
            "City",
            "State"
        ];

        List<List<object>> rows = [];

        foreach (OrderReportItem item in orderItems)
        {
            rows.Add(
            [
                item.OrderId,
                item.Driver.DriverId,
                item.Driver.UserData.Username,
                item.Organization.OrgId,
                item.Organization.Name,
                item.Product?.Name ?? "N/A",
                item.Product?.ItemId ?? "N/A",
                item.PointsSpent,
                item.OrderDate,
                item.DriverAddress?.City ?? "N/A",
                item.DriverAddress?.State ?? "N/A"
            ]);
        }

        return new()
        {
            Headers = headers,
            Rows = rows
        };
    }
}
