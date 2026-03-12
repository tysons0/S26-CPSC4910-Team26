using Class4910Api.Models;

namespace Class4910Api.Services.Interfaces;

public interface IApplicationService
{
    Task<bool> UpdateApplicationStatus(int applicationId, string newStatus, string reason, int editorUserId);
    Task<bool> CreateApplication(int driverId, int orgId, string message);

    Task<bool> DeleteApplication(int applicationId);

    Task<DriverApplication?> GetApplication(int applicationId);

    Task<List<DriverApplication>?> GetDriverApplicationsByOrg(int orgId);
    Task<List<DriverApplication>?> GetDriverApplicationsByDriver(int driverId);
    Task<List<DriverApplication>?> GetAllDriverApplications();
}
