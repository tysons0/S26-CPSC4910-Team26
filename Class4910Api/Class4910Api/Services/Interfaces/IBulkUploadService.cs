using Class4910Api.Models;

namespace Class4910Api.Services.Interfaces;

public interface IBulkUploadService
{
    Task<BulkUploadResult> ProcessFileAsync(IFormFile file, UserRole uploadingUserRole, CancellationToken cancellationToken);
}
