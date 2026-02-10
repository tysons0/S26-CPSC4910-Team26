using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;

using static Class4910Api.Configuration.ConstantValues;

namespace Class4910Api.Services;

public class DriverService : IDriverService
{
    private readonly ILogger<DriverService> _logger;
    private readonly string _dbConnection;

    public DriverService(ILogger<DriverService> logger, IOptions<DatabaseConnection> databaseConnection)
    {
        _logger = logger;
        _dbConnection = databaseConnection.Value.Connection;
    }

    public Task<Driver?> GetDriverByDriverId(int driverId)
    {
        throw new NotImplementedException();
    }

    public Task<Driver?> GetDriverByName(string name)
    {
        throw new NotImplementedException();
    }

    public Task<Driver?> GetDriverByUserId(int userId)
    {
        throw new NotImplementedException();
    }
}
