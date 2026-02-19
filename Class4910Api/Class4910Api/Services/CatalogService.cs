using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;

public class CatalogService : ICatalogService
{
    private readonly string _dbConnection;

    public CatalogService(IOptions<DatabaseConnection> dbConnection)
    {
        _dbConnection = dbConnection.Value.Connection;
    }


    public async Task<IEnumerable<CatalogItem>> GetCatalogAsync(int orgId)
    {
        List<CatalogItem> items = new();
        const string sql = """
            SELECT
                c.CatalogItemID,
                c.EbayItemID,
                e.Title,
                e.ImageUrl,
                c.Points,
                c.IsActive
            FROM SponsorCatalogItems c
            JOIN EbayItems e ON e.ItemID = c.EbayItemID
            WHERE c.OrgID = @OrgID;
        """;

        using MySqlConnection conn = new MySqlConnection(_dbConnection);
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
                Title = reader.GetString(reader.GetOrdinal("Title")),
                ImageUrl = reader.GetString(reader.GetOrdinal("ImageUrl")),
                Points = reader.GetInt32(reader.GetOrdinal("Points")),
                IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
            });
        }
        return items;
    }

    public async Task AddItemAsync(int orgId, AddCatalogItemRequest request)
    {
        const string sql = """
            INSERT INTO SponsorCatalogItems (OrgID, EbayItemID, Points)
            VALUES (@OrgID, @EbayItemID, @Points);
        """;

        using MySqlConnection conn = new MySqlConnection(_dbConnection);
        using MySqlCommand cmd = new(sql, conn);

        cmd.Parameters.AddWithValue("@OrgID", orgId);
        cmd.Parameters.AddWithValue("@EbayItemID", request.EbayItemId);
        cmd.Parameters.AddWithValue("@Points", request.Points);

        await conn.OpenAsync();
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task UpdateItemAsync(int orgId, int catalogItemId, UpdateCatalogItemRequest request)
    {
        const string sql = """
            UPDATE SponsorCatalogItems
            SET Points = @Points,
                IsActive = @IsActive
            WHERE CatalogItemID = @CatalogItemID
              AND OrgID = @OrgID;
        """;

        using MySqlConnection conn = new MySqlConnection(_dbConnection);
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

    public async Task RemoveItemAsync(int orgId, int catalogItemId)
    {
        const string sql = """
            DELETE FROM SponsorCatalogItems
            WHERE CatalogItemID = @CatalogItemID
              AND OrgID = @OrgID;
        """;

        using MySqlConnection conn = new MySqlConnection(_dbConnection);
        using MySqlCommand cmd = new(sql, conn);

        cmd.Parameters.AddWithValue("@CatalogItemID", catalogItemId);
        cmd.Parameters.AddWithValue("@OrgID", orgId);

        await conn.OpenAsync();
        await cmd.ExecuteNonQueryAsync();
    }
}
