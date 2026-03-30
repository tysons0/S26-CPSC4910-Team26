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
    public async Task<IEnumerable<DriverWishlistItem>> GetWishlistAsync(int driverId)
    {
        _logger.LogInformation("Retrieve Wishlist for Driver[{Id}]", driverId);
        try
        {
            var items = new List<DriverWishlistItem>();
            string sql = @"
                 SELECT dw.WishlistID,
                     dw.catalogItemId AS CatalogItemID,
                     sci.Points AS Points,
                     ei.Name,
                     ei.Description,
                     ei.ImageURL,
                     ei.ItemWebURL,
                     ei.LastKnownPrice,
                     ei.Currency,
                     ei.ItemCondition
                 FROM DriverWishlist dw
                 JOIN SponsorCatalogItems sci ON dw.catalogItemId = sci.CatalogItemID
                 JOIN EbayItems ei ON sci.EbayItemID = ei.EbayItemID
                 WHERE dw.driverId = @DriverID
                 ORDER BY dw.createdAt DESC;";

            using MySqlConnection conn = new(_dbConnection);
            using MySqlCommand cmd = new(sql, conn);

            cmd.Parameters.AddWithValue("@DriverID", driverId);

            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                items.Add(new DriverWishlistItem
                {
                    WishlistID = reader.GetInt32(reader.GetOrdinal("WishlistID")),
                    CatalogItemID = reader.GetInt32(reader.GetOrdinal("CatalogItemID")),
                    Points = reader.GetInt32(reader.GetOrdinal("Points")),
                    Name = reader.GetString(reader.GetOrdinal("Name")),
                    Description = reader.GetString(reader.GetOrdinal("Description")),
                    ImageURL = reader.GetString(reader.GetOrdinal("ImageURL")),
                    ItemWebURL = reader.GetString(reader.GetOrdinal("ItemWebURL")),
                    LastKnownPrice = reader.GetDecimal(reader.GetOrdinal("LastKnownPrice")),
                    Currency = reader.GetString(reader.GetOrdinal("Currency")),
                    ItemCondition = reader.GetString(reader.GetOrdinal("ItemCondition"))
                });
            }
            return items;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving wishlist for Driver[{Id}]", driverId);
            return new List<DriverWishlistItem>();
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