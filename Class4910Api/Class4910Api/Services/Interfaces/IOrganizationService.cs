using Class4910Api.Models;
using Class4910Api.Models.Requests;

namespace Class4910Api.Services.Interfaces;

public interface IOrganizationService
{
    Task<Organization?> CreateOrganization(OrganizationCreationRequest creationRequest, int creatorUserId);

    Task<Organization?> GetOrganizationById(int organizationId);

    Task<Organization?> GetOrganizationByName(string orgName);

    Task<Organization?> UpdateOrganizationPointValue(int organizationId, double newPointValue, int updaterUserId);

    Task<List<Organization>?> GetOrganizations();
}
