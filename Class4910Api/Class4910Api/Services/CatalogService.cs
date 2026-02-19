using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Dapper;
using MySql.Data.MySqlClient;

public class CatalogService : ICatalogService
{
    private readonly string _dbConnection;

    public CatalogService(IOptions<DbConnectionConfig> dbConnection)
    {
        _dbConnection = dbConnection.Value.Connection;
    }


    public async Task<IEnumerable<CatalogItemDto>> GetCatalogAsync(int orgId)
    {
        const string sql = """
            SELECT
                c.CatalogItemID AS CatalogItemId,
                c.EbayItemID,
                e.Title,
                e.ImageUrl,
                c.Points,
                c.IsActive
            FROM SponsorCatalogItems c
            JOIN EbayItems e ON e.EbayItemID = c.EbayItemID
            WHERE c.OrgID = @OrgID;
        """;

        using var conn = new MySqlConnection(_dbConnection);
        return await conn.QueryAsync<CatalogItemDto>(sql, new { OrgID = orgId });
    }

    public async Task AddItemAsync(int orgId, AddCatalogItemRequest request)
    {
        const string sql = """
            INSERT INTO SponsorCatalogItems (OrgID, EbayItemID, Points)
            VALUES (@OrgID, @EbayItemID, @Points);
        """;

        using var conn = new MySqlConnection(_dbConnection);
        await conn.ExecuteAsync(sql, new
        {
            OrgID = orgId,
            request.EbayItemId,
            request.Points
        });
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

        using var conn = new MySqlConnection(_dbConnection);
        int affected = await conn.ExecuteAsync(sql, new
        {
            CatalogItemID = catalogItemId,
            OrgID = orgId,
            request.Points,
            request.IsActive
        });

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

        using var conn = new MySqlConnection(_dbConnection);
        await conn.ExecuteAsync(sql, new
        {
            CatalogItemID = catalogItemId,
            OrgID = orgId
        });
    }
}
