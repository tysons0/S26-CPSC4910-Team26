using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;

namespace Class4910Api.Services;

public class BulkUploadService : IBulkUploadService
{
    private readonly ILogger<BulkUploadService> _logger;
    private readonly IAuthService _authService;
    private readonly IUserService _userService;
    private readonly IOrganizationService _organizationService;
    private readonly IDriverService _driverService;
    private readonly RequestData _blankRequestData;

    public BulkUploadService(ILogger<BulkUploadService> logger,
                             IAuthService authService,
                             IUserService userService,
                             IOrganizationService organizationService,
                             IDriverService driverService)
    {
        _logger = logger;
        _authService = authService;
        _userService = userService;
        _organizationService = organizationService;
        _driverService = driverService;
    }

    public async Task<BulkUploadResult> ProcessFileAsync(IFormFile file, UserRole uploadingUserRole,
                                                         CancellationToken cancelToken)
    {
        BulkUploadResult result = new();
        try
        {
            if (file is null || file.Length == 0)
            {
                result.Errors.Add("No file uploaded or file is empty.");
                return result;
            }

            using Stream stream = file.OpenReadStream();
            using StreamReader reader = new(stream);

            var lineNumber = 0;

            string? rawLine;
            while ((rawLine = await reader.ReadLineAsync(cancelToken)) != null)
            {
                cancelToken.ThrowIfCancellationRequested();

                lineNumber++;
                result.TotalLines++;

                if (string.IsNullOrWhiteSpace(rawLine))
                {
                    result.Errors.Add($"Line [{lineNumber}] is empty.");
                    continue;
                }

                PipeDelimitRow row;
                try
                {
                    row = PipeDelimitRow.ParseLine(rawLine);
                }
                catch (Exception ex)
                {
                    result.Errors.Add($"Could not parse line[{lineNumber}]: {ex.Message}");
                    continue;
                }

                var validationErrors = await ValidateRowAsync(row, uploadingUserRole);

                if (validationErrors.Count > 0)
                {
                    foreach (var error in validationErrors)
                    {
                        result.Errors.Add($"Line [{lineNumber}]: {error}");
                    }

                    continue;
                }

                try
                {
                    await ProcessRowAsync(row, cancelToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Bulk upload failed on line {LineNumber}", lineNumber);
                    result.Errors.Add($"Processing line[{lineNumber}] failed: {ex.Message}");
                }
            }

            return result;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Bulk upload was canceled.");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing bulk upload file");
            return result;
        }
    }

    private async Task<List<string>> ValidateRowAsync(PipeDelimitRow row, UserRole uploadingUserRole)
    {
        List<string> errors = [];

        string type = row.Type?.Trim().ToUpperInvariant() ?? string.Empty;

        if (type != "O" && type != "D" && type != "S")
        {
            errors.Add($"Invalid Type '{row.Type}'. Must be 'O', 'D', or 'S'.");
            return errors;
        }

        if (row.Points.HasValue && string.IsNullOrWhiteSpace(row.ReasonForPoints))
        {
            errors.Add("ReasonForPoints is required when Points is provided.");
        }

        if (row.Points.HasValue && row.Points.Value < 0)
        {
            errors.Add("Points cannot be negative.");
        }

        if (uploadingUserRole == UserRole.Sponsor)
        {
            if (type == "O")
            {
                errors.Add("Sponsors cannot upload organization ('O') rows.");
            }

            if (!string.IsNullOrWhiteSpace(row.OrganizationName))
            {
                errors.Add("Sponsors must omit OrganizationName.");
            }

            if (type == "S" && row.Points.HasValue)
            {
                errors.Add("Points cannot be assigned to sponsor users.");
            }
        }

        if (type == "O")
        {
            if (uploadingUserRole != UserRole.Admin)
            {
                errors.Add("Only admins can upload organization ('O') rows.");
            }

            if (string.IsNullOrWhiteSpace(row.OrganizationName))
            {
                errors.Add("OrganizationName is required for type 'O'.");
            }

            return errors;
        }

        if (string.IsNullOrWhiteSpace(row.FirstName))
        {
            errors.Add("FirstName is required for type 'D' and 'S'.");
        }

        if (string.IsNullOrWhiteSpace(row.LastName))
        {
            errors.Add("LastName is required for type 'D' and 'S'.");
        }

        if (string.IsNullOrWhiteSpace(row.Email))
        {
            errors.Add("Email is required for type 'D' and 'S'.");
        }

        return errors;
    }

    private async Task ProcessRowAsync(PipeDelimitRow row, CancellationToken cancelToken)
    {
        string type = row.Type.Trim().ToUpperInvariant();

        switch (type)
        {
            case "O":
                await ProcessOrganizationRowAsync(row, cancelToken);
                break;

            case "S":
                await ProcessSponsorRowAsync(row, cancelToken);
                break;

            case "D":
                await ProcessDriverRowAsync(row, cancelToken);
                break;

            default:
                throw new InvalidOperationException($"Unsupported row type '{row.Type}'.");
        }
    }

    private async Task ProcessOrganizationRowAsync(PipeDelimitRow row, CancellationToken cancelToken)
    {
    }

    private async Task ProcessSponsorRowAsync(PipeDelimitRow row, CancellationToken cancelToken)
    {

    }

    private async Task ProcessDriverRowAsync(PipeDelimitRow row, CancellationToken cancelToken)
    {
        UserRequest driverRequest = new()
        {
            UserName = row.UserName,
            Password = "newPassword"
        };
    }
}
