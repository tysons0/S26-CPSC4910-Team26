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
    private readonly ISponsorService _sponsorService;
    private readonly RequestData _blankRequestData;

    public BulkUploadService(ILogger<BulkUploadService> logger,
                             IAuthService authService,
                             IUserService userService,
                             IOrganizationService organizationService,
                             IDriverService driverService,
                             ISponsorService sponsorService)
    {
        _logger = logger;
        _authService = authService;
        _userService = userService;
        _organizationService = organizationService;
        _driverService = driverService;
        _blankRequestData = new RequestData
        {
            ClientIP = System.Net.IPAddress.None,
            UserAgent = "BulkUpload"
        };
        _sponsorService = sponsorService;
    }

    public async Task<BulkUploadResult> ProcessFileAsync(IFormFile file, User uploadingUser,
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
                    if (uploadingUser.Role == UserRole.Sponsor)
                    {
                        Sponsor sponsor = await _sponsorService.GetSponsorByUserId(uploadingUser.Id)
                            ?? throw new InvalidOperationException("Uploading user is a sponsor but no sponsor record found.");
                        Organization organization = await _organizationService.GetOrganizationById(sponsor.OrganizationId)
                            ?? throw new InvalidOperationException("Sponsor's organization not found.");
                        row.OrganizationName = organization.Name;
                    }
                }
                catch (Exception ex)
                {
                    result.Errors.Add($"Could not parse line[{lineNumber}]: {ex.Message}");
                    continue;
                }

                List<string> validationErrors = await ValidateRowAsync(row, uploadingUser.Role);

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
                    result.Successes.Add(await ProcessRowAsync(row, cancelToken));
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
            _logger.LogWarning("Validation failed for row {Row}: {Errors}", row, errors);
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

        if (type == "S")
        {
            if (row.Points is not null)
            {
                errors.Add("Points cannot be assigned to sponsor users.");
            }
        }

        if (string.IsNullOrWhiteSpace(row.FirstName))
        {
            errors.Add("FirstName is required for type 'D' and 'S'.");
        }

        if (string.IsNullOrWhiteSpace(row.LastName))
        {
            errors.Add("LastName is required for type 'D' and 'S'.");
        }

        if (string.IsNullOrWhiteSpace(row.Email) || !row.Email.Contains('@'))
        {
            errors.Add("Email is required for type 'D' and 'S' and must be a valid email address.");
        }

        if (type != "0" && row.OrganizationName is not null)
        {
            Organization? org = await _organizationService.GetOrganizationByName(row.OrganizationName);
            if (org is null)
            {
                errors.Add($"Organization '{row.OrganizationName}' does not exist.");
            }
        }

        _logger.LogInformation("Validation completed for row {Row} with {ErrorCount} errors", row, errors.Count);
        return errors;
    }

    private async Task<string> ProcessRowAsync(PipeDelimitRow row, CancellationToken cancelToken)
    {
        string type = row.Type.Trim().ToUpperInvariant();

        switch (type)
        {
            case "O":
                _logger.LogInformation("Processing organization row {Row}", row);
                return await ProcessOrganizationRowAsync(row, cancelToken);

            case "S":
                _logger.LogInformation("Processing sponsor row {Row}", row);
                return await ProcessSponsorRowAsync(row, cancelToken);

            case "D":
                _logger.LogInformation("Processing driver row {Row}", row);
                return await ProcessDriverRowAsync(row, cancelToken);

            default:
                _logger.LogError("Unsupported row type '{RowType}' in row {Row}", row.Type, row);
                throw new InvalidOperationException($"Unsupported row type '{row.Type}'.");
        }
    }

    private async Task<string> ProcessOrganizationRowAsync(PipeDelimitRow row, CancellationToken cancelToken)
    {
        if (row.OrganizationName is null)
            throw new InvalidOperationException("OrganizationName is required for organization rows.");

        Organization? existingOrg = await _organizationService.GetOrganizationByName(row.OrganizationName);

        if (existingOrg is not null)
        {
            return $"Organization '{row.OrganizationName}' already exists. No action taken.";
        }

        OrganizationCreationRequest newOrg = new()
        {
            Name = row.OrganizationName,
            Description = $"Created via bulk upload on {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC",
        };

        Organization org = await _organizationService.CreateOrganization(newOrg, 0)
            ?? throw new InvalidOperationException($"Failed to create organization '{row.OrganizationName}'.");

        return $"Created organization '{row.OrganizationName}'.";
    }

    private async Task<string> ProcessSponsorRowAsync(PipeDelimitRow row, CancellationToken cancelToken)
    {
        List<string> actions = [];
        if (row.Email is null)
            throw new InvalidOperationException("Email is required for sponsor rows.");
        if (row.OrganizationName is null)
            throw new InvalidOperationException("OrganizationName is required for sponsor rows.");

        Organization organization = await _organizationService.GetOrganizationByName(row.OrganizationName)
            ?? throw new InvalidOperationException($"Organization '{row.OrganizationName}' does not exist.");

        User? user = await _userService.FindUserByEmail(row.Email);

        if (user is null)
        {
            UserRequest sponsorRequest = new()
            {
                UserName = row.Email,
                Password = "newPassword"
            };

            Sponsor? sponsor = await _authService.RegisterSponsorUser(sponsorRequest, organization.OrgId, 0, _blankRequestData)
                ?? throw new($"Failed to create user for sponsor with email {row.Email}");
            UserUpdateRequest updateRequest = new()
            {
                Email = row.Email,
                FirstName = row.FirstName,
                LastName = row.LastName,
            };

            await _userService.UpdateUser(sponsor.UserData.Id, updateRequest);
            actions.Add($"Created new sposnor with email '{row.Email}' under Organization '{organization.Name}'");
        }
        else
        {
            UserUpdateRequest updateRequest = new()
            {
                Email = row.Email,
                FirstName = row.FirstName,
                LastName = row.LastName,
            };

            await _userService.UpdateUser(user.Id, updateRequest);
            actions.Add($"Updated existing sponsor user with email '{row.Email}' under Organization '{organization.Name}'");
        }

        return string.Join("; ", actions);
    }

    private async Task<string> ProcessDriverRowAsync(PipeDelimitRow row, CancellationToken cancelToken)
    {
        List<string> actions = [];
        if (row.Email is null)
            throw new InvalidOperationException("Email is required for driver rows.");

        User? user = await _userService.FindUserByEmail(row.Email);
        Driver? driver;

        if (user is null)
        {
            UserRequest driverRequest = new()
            {
                UserName = row.Email,
                Password = "newPassword"
            };

            driver = await _authService.RegisterDriverUser(driverRequest, _blankRequestData)
                ?? throw new($"Failed to create user for driver with email {row.Email}");
            UserUpdateRequest updateRequest = new()
            {
                Email = row.Email,
                FirstName = row.FirstName,
                LastName = row.LastName,
            };

            await _userService.UpdateUser(driver.UserData.Id, updateRequest);
            actions.Add($"Created new driver with email '{row.Email}'");
        }
        else
        {
            driver = await _driverService.GetDriverByUserId(user.Id)
                ?? throw new InvalidOperationException($"User with email {row.Email} exists but is not a driver.");
        }


        if (row.OrganizationName is not null)
        {
            Organization org = await _organizationService.GetOrganizationByName(row.OrganizationName)
                ?? throw new InvalidOperationException($"Organization '{row.OrganizationName}' does not exist.");

            if (!driver.IsInOrg(org.OrgId))
            {
                await _driverService.AddDriverToOrg(driver.DriverId, org.OrgId);
                actions.Add($"Added driver to organization '{org.Name}'");
            }

            if (row.Points.HasValue)
            {
                PointChangeRequest pointChangeRequest = new()
                {
                    OrgId = org.OrgId,
                    PointChange = row.Points.Value,
                    ChangeReason = row.ReasonForPoints ?? "Bulk upload points"
                };
                await _driverService.AddToDriverPointHistory(driver.DriverId, null, pointChangeRequest);
                actions.Add($"Assigned [{row.Points.Value}] points to driver in organization '{org.Name}'");
            }
        }

        return string.Join("; ", actions);
    }
}
