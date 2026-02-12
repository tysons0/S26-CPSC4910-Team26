using Class4910Api.Models;

namespace Class4910Api.Services.Interfaces;

public interface IOrganizationService
{
    Task<Organization?> CreateOrganization(string orgName, int creatorUserId);

    Task<Organization?> GetOrganizationById(int organizationId);

    Task<Organization?> GetOrganizationByName(string orgName);

    Task<Organization?> UpdateOrganizationPointValue(int organizationId, float newPointValue, int updaterUserId);

    Task<List<Organization>?> GetOrganizations();
}
