using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;

namespace Class4910Api.Services;

public class DriverWishlistService : IDriverWishlistService
{
    private readonly string _dbConnection;
    private readonly ILogger<DriverWishlistService> _logger;
    public DriverWishlistService(IOptions<DatabaseConnection> dbConnection, ILogger<DriverWishlistService> logger)
    {
        _dbConnection = dbConnection.Value.Connection;
        _logger = logger;
    }
    public async Task<IEnumerable<DriverWishlist>> GetWishlistAsync(int driverId)
    {
        _logger.LogInformation("Retrieve Wishlist for Driver[{Id}]", driverId);
        try
        {
            List<DriverWishlist> items = [];
            string sql = @"
            SELECT
                wishlistId,
                driverId,
                orgId,
                catalogItemId,
                createdAt
            FROM DriverWishlist
            WHERE driverId = @DriverID;";

            using MySqlConnection conn = new(_dbConnection);
            using MySqlCommand cmd = new(sql, conn);

            cmd.Parameters.AddWithValue("@DriverID", driverId);

            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                items.Add(new DriverWishlist
                {
                    WishlistID = reader.GetInt32(reader.GetOrdinal("WishlistID")),
                    DriverID = reader.GetInt32(reader.GetOrdinal("DriverID")),
                    OrgID = reader.GetInt32(reader.GetOrdinal("OrgID")),
                    CatalogItemID = reader.GetInt32(reader.GetOrdinal("CatalogItemID"))
                });
            }
            return items;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving wishlist for Driver[{Id}]", driverId);
            return [];
        }
    }
    public async Task AddToWishlistAsync(int driverId, int orgId, int catalogItemId)
    {
        _logger.LogInformation("Add to Wishlist for Driver[{DriverId}] - Org[{OrgId}] CatalogItem[{CatalogItemId}]", driverId, orgId, catalogItemId);
        try
        {
            string sql = @"
            INSERT IGNORE INTO DriverWishlist (driverId, orgId, catalogItemId, createdAt)
            VALUES (@DriverID, @OrgID, @CatalogItemID, CURRENT_TIMESTAMP());";

            using MySqlConnection conn = new(_dbConnection);
            using MySqlCommand cmd = new(sql, conn);

            cmd.Parameters.AddWithValue("@DriverID", driverId);
            cmd.Parameters.AddWithValue("@OrgID", orgId);
            cmd.Parameters.AddWithValue("@CatalogItemID", catalogItemId);

            await conn.OpenAsync();
            await cmd.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding to wishlist for Driver[{DriverId}] - Org[{OrgId}] CatalogItem[{CatalogItemId}]", driverId, orgId, catalogItemId);
        }
    }
    public async Task RemoveFromWishlistAsync(int driverId, int catalogItemId)
    {
        _logger.LogInformation("Remove from Wishlist for Driver[{DriverId}] - CatalogItem[{CatalogItemId}]", driverId, catalogItemId);
        try
        {
            string sql = @"
            DELETE FROM DriverWishlist
            WHERE driverId = @DriverID AND catalogItemId = @CatalogItemID;";

            using MySqlConnection conn = new(_dbConnection);
            using MySqlCommand cmd = new(sql, conn);

            cmd.Parameters.AddWithValue("@DriverID", driverId);
            cmd.Parameters.AddWithValue("@CatalogItemID", catalogItemId);

            await conn.OpenAsync();
            await cmd.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing from wishlist for Driver[{DriverId}] - CatalogItem[{CatalogItemId}]", driverId, catalogItemId);
        }
    }
}