using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;

namespace Class4910Api.Services;

public class CatalogService : ICatalogService
{
    private readonly string _dbConnection;
    private readonly IEbayService _ebayService;
    private readonly ILogger<CatalogService> _logger;

    public CatalogService(IOptions<DatabaseConnection> dbConnection, IEbayService ebayService, ILogger<CatalogService> logger)
    {
        _dbConnection = dbConnection.Value.Connection;
        _ebayService = ebayService;
        _logger = logger;
    }


    public async Task<IEnumerable<CatalogItem>> GetCatalogAsync(int orgId)
    {
        _logger.LogInformation("Retrieve Catalogs for Organization[{Id}]", orgId);
        try
        {
            List<CatalogItem> items = [];
            string sql = @"
            SELECT
                c.CatalogItemID,
                c.EbayItemID,
                c.Points,
                c.IsActive,
                e.Name,
                e.Description,
                e.ImageURL,
                e.ItemWebURL,
                e.LastKnownPrice,
                e.Currency,
                e.ItemCondition
            FROM SponsorCatalogItems c
            INNER JOIN EbayItems e ON e.EbayItemID = c.EbayItemID
            WHERE c.OrgID = @OrgID;
            ";

            using MySqlConnection conn = new(_dbConnection);
            using MySqlCommand cmd = new(sql, conn);
            cmd.Parameters.AddWithValue("@OrgID", orgId);
            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                items.Add(new CatalogItem
                {
                    CatalogItemID = reader.GetInt32(reader.GetOrdinal("CatalogItemID")),
                    EbayItemId = reader.GetString(reader.GetOrdinal("EbayItemID")),
                    Title = reader.GetString(reader.GetOrdinal("Name")),
                    Description = reader.GetString(reader.GetOrdinal("Description")),
                    ImageUrl = reader.GetString(reader.GetOrdinal("ImageURL")),
                    ItemWebUrl = reader.GetString(reader.GetOrdinal("ItemWebURL")),
                    Price = reader.GetDecimal(reader.GetOrdinal("LastKnownPrice")),
                    Currency = reader.GetString(reader.GetOrdinal("Currency")),
                    Condition = reader.GetString(reader.GetOrdinal("ItemCondition")),
                    Points = reader.GetInt32(reader.GetOrdinal("Points")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                });
            }
            return items;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error Retrieving Catalog Items for Organization[{Id}].", orgId);
            return [];
        }
    }

    public async Task AddItemAsync(int orgId, AddCatalogItemRequest request)
    {
        _logger.LogInformation("Add Item[{ItemRequest}] to Organization[{Id}]", request, orgId);

        try
        {
            using MySqlConnection conn = new(_dbConnection);
            await conn.OpenAsync();

            string checkSQL = @"
            SELECT COUNT(*)
            FROM EbayItems
            WHERE EbayItemID = @EbayItemID;
            ";

            using MySqlCommand checkCmd = new(checkSQL, conn);
            checkCmd.Parameters.AddWithValue("@EbayItemID", request.EbayItemId);
            int exists = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
            if (exists == 0)
            {
                var ebayItem = await _ebayService.GetProductByIDAsync(request.EbayItemId);
                if (ebayItem == null)
                {
                    throw new Exception("Invalid Ebay item ID.");
                }
                const string insertEbaySql = @"
                INSERT INTO EbayItems
                    (EbayItemID, Name, Description, ImageURL, ItemWebURL,
                     LastKnownPrice, Currency, ItemCondition,
                     CreatedAtUtc, LastUpdateUtc)
                VALUES
                    (@EbayItemID, @Name, @Description, @ImageURL, @ItemWebURL,
                     @Price, @Currency, @Condition,
                     UTC_TIMESTAMP(), UTC_TIMESTAMP());
                ";
                using MySqlCommand insertEbayCmd = new(insertEbaySql, conn);

                insertEbayCmd.Parameters.AddWithValue("@EbayItemID", ebayItem.ItemId);
                insertEbayCmd.Parameters.AddWithValue("@Name", ebayItem.Name ?? "");
                insertEbayCmd.Parameters.AddWithValue("@Description", ebayItem.Description ?? "");
                insertEbayCmd.Parameters.AddWithValue("@ImageURL", ebayItem.Image ?? "");
                insertEbayCmd.Parameters.AddWithValue("@ItemWebURL", ebayItem.ItemWebUrl ?? "");
                insertEbayCmd.Parameters.AddWithValue("@Price", ebayItem.Price);
                insertEbayCmd.Parameters.AddWithValue("@Currency", ebayItem.Currency ?? "USD");
                insertEbayCmd.Parameters.AddWithValue("@Condition", ebayItem.Condition ?? "");

                await insertEbayCmd.ExecuteNonQueryAsync();
            }
            string insertCatalogSql = @"
            INSERT INTO SponsorCatalogItems
                (OrgID, EbayItemID, Points, IsActive, CreatedAtUtc, UpdatedAtUtc)
            VALUES
                (@OrgID, @EbayItemID, @Points, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP());
            ";

            using MySqlCommand insertCatalogCmd = new(insertCatalogSql, conn);
            insertCatalogCmd.Parameters.AddWithValue("@OrgID", orgId);
            insertCatalogCmd.Parameters.AddWithValue("@EbayItemID", request.EbayItemId);
            insertCatalogCmd.Parameters.AddWithValue("@Points", request.Points);

            await insertCatalogCmd.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error Adding Item[{ItemRequest}] to Organization[{Id}]", request, orgId);
        }
    }

    public async Task UpdateItemAsync(int orgId, int catalogItemId, UpdateCatalogItemRequest request)
    {
        _logger.LogInformation("Update Item[{Id}] for Organization[{Id}] to [{UpdateRequest}]",
            catalogItemId, orgId, request);
        try
        {
            string sql = @"
            UPDATE SponsorCatalogItems
            SET Points = @Points,
                IsActive = @IsActive,
                UpdatedAtUtc = UTC_TIMESTAMP()
            WHERE CatalogItemID = @CatalogItemID
              AND OrgID = @OrgID;
            ";

            using MySqlConnection conn = new(_dbConnection);
            using MySqlCommand cmd = new(sql, conn);

            cmd.Parameters.AddWithValue("@CatalogItemID", catalogItemId);
            cmd.Parameters.AddWithValue("@OrgID", orgId);
            cmd.Parameters.AddWithValue("@Points", request.Points);
            cmd.Parameters.AddWithValue("@IsActive", request.IsActive);

            await conn.OpenAsync();
            int affected = await cmd.ExecuteNonQueryAsync();

            if (affected == 0)
                throw new UnauthorizedAccessException("Catalog item not found or access denied.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error Updating Item[{Id}] for Organization[{Id}] to [{UpdateRequest}]",
           catalogItemId, orgId, request);
        }
    }

    public async Task RemoveItemAsync(int orgId, int catalogItemId)
    {
        _logger.LogInformation("Remove Item[{ItemId}] from Organization[{OrgId}]", catalogItemId, orgId);
        try
        {
            string sql = @"
            DELETE FROM SponsorCatalogItems
            WHERE CatalogItemID = @CatalogItemID
              AND OrgID = @OrgID;
            ";

            using MySqlConnection conn = new(_dbConnection);
            using MySqlCommand cmd = new(sql, conn);

            cmd.Parameters.AddWithValue("@CatalogItemID", catalogItemId);
            cmd.Parameters.AddWithValue("@OrgID", orgId);

            await conn.OpenAsync();
            await cmd.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error Removing Item[{ItemId}] from Organization[{OrgId}]", catalogItemId, orgId);
        }
    }
}