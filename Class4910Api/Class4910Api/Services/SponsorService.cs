using System.Data.Common;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using System.Data;
using Microsoft.AspNetCore.Identity;
using MySql.Data.MySqlClient;

using static Class4910Api.Configuration.ConstantValues;


namespace Class4910Api.Services;

public class SponsorService : ISponsorService
{
    private readonly ILogger<SponsorService> _logger;
    private readonly string _dbConnection;
    private readonly IUserService _userService;

    public SponsorService(ILogger<SponsorService> logger, IOptions<DatabaseConnection> databaseConnection, IUserService userService)
    {
        _logger = logger;
        _dbConnection = databaseConnection.Value.Connection;
        _userService = userService;
    }

    public Task<Sponsor?> GetSponsorByName(string name)
    {
        throw new NotImplementedException();
    }

    public Task<Sponsor?> GetSponsorBySponsorId(int sponsorId)
    {
        throw new NotImplementedException();
    }

    public Task<Sponsor?> GetSponsorByUserId(int userId)
    {
        throw new NotImplementedException();
    }

    private async Task<User> GetSponsorFromReader(DbDataReader reader)
    {
        throw new NotImplementedException();
        int sponsorId = reader.GetInt32(SponsorIdField.Name);
    }
}
