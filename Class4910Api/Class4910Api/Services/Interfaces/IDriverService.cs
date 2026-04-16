using System.Data.Common;
using Class4910Api.Models;
using Class4910Api.Models.Requests;

namespace Class4910Api.Services.Interfaces;

public interface IDriverService
{
    Task<Driver?> GetDriverByDriverId(int driverId);
    Task<Driver?> GetDriverByUserId(int userId);

    Task<Driver?> GetDriverByName(string userName);

    Task<List<Driver>?> GetAllDrivers();
    Task<List<Driver>?> GetDriversByOrgId(int orgId);

    Task<DriverAddress?> GetDriverAddressById(int driverId, int addressId);

    Task<List<DriverAddress>?> GetDriverAddresses(int driverId);

    Task<bool> AddDriverAddress(int driverId, AddressRequest addressRequest);

    Task<bool> SetPrimaryAddress(int driverId, int addressId);

    Task<bool> UpdateAddress(int driverId, int addressId, AddressRequest addressRequest);

    Task<bool> DeleteDriverAddress(int driverId, int addressId);

    Task<bool> ChangePointAlertPreference(int driverId, bool enabled);

    Task<bool> AddToDriverPointHistory(int driverId, int? sponsorId, PointChangeRequest pointChangeRequest);

    Task<List<PointHistoryRecord>?> GetDriverPointHistory(int driverId);

    Task<PointHistoryRecord> GetPointHistoryRecordFromReader(DbDataReader reader, string? prefix = null);

    Task AddDriverToOrg(int driverId, int orgId);
}
