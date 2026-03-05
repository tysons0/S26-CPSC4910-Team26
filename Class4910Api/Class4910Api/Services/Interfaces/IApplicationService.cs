using Class4910Api.Models;

namespace Class4910Api.Services.Interfaces;

public interface IApplicationService
{
    Task<bool> UpdateApplicationStatus(int applicationId, string newStatus, string reason, int editorUserId);
    Task<bool> CreateApplication(int driverId, string message);

    Task<List<DriverApplication>?> GetDriverApplicationsByOrg(int orgId);
    Task<List<DriverApplication>?> GetDriverApplicationsByDriver(int driverId);
    Task<List<DriverApplication>?> GetAllDriverApplications();
}
