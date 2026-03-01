using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;
using Class4910Api.Configuration;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MySql.Data.MySqlClient;

using static Class4910Api.ConstantValues;

namespace Class4910Api.Services;

public class AuthService : IAuthService
{
    private readonly IContextService _contextService;
    private readonly ILogger<AuthService> _logger;
    private readonly JwtSettings _jwtSettings;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IUserService _userService;
    private readonly string _dbConnection;
    private readonly AppSettings _appSettings;
    private readonly ISponsorService _sponserService;

    public AuthService(IContextService contextService, IUserService userService, ISponsorService sponsorService,
        IOptions<JwtSettings> jwtOptions, ILogger<AuthService> logger, IPasswordHasher<User> passwordHasher,
        IOptions<DatabaseConnection> databaseConnection, IOptions<AppSettings> appSettings)
    {
        _contextService = contextService;
        _logger = logger;
        _jwtSettings = jwtOptions.Value;
        _passwordHasher = passwordHasher;
        _userService = userService;
        _appSettings = appSettings.Value;
        _dbConnection = databaseConnection.Value.Connection;
        _sponserService = sponsorService;
    }


    public async Task<LoginResult> LoginAsync(UserRequest request, RequestData loginData)
    {
        _logger.LogInformation("LoginAsync called for user: {UserName} with data: {RequestData}",
                               request.UserName, loginData);
        string messageForInvalidLogin = "Invalid credentials, confirm the username and password are correct.";
        bool loginSuccess = false;
        bool recordLoginAttempt = true;
        try
        {
            int loginAttempts = await GetRecentLoginAttempts(loginData)
                ?? throw new("Failed to retrieve login attempts");

            if (loginAttempts > _appSettings.MaxLoginAttempts)
            {
                recordLoginAttempt = false;
                return new() { Error = "Too many login attempts. Please try again later." };
            }

            // Check if user exists
            User? requestedUser = await _userService.FindUserByName(request.UserName);

            if (requestedUser is null)
            {
                return new() { Error = messageForInvalidLogin };
            }

            if (VerifyPassword(requestedUser, request.Password))
            {
                string token = GenerateToken(requestedUser, _jwtSettings);
                loginSuccess = true;
                return new() { Token = token, User = requestedUser.ToReadFormat() };
            }
            else
            {
                return new() { Error = messageForInvalidLogin };
            }
        }
        catch (Exception ex)
        {
            recordLoginAttempt = false;
            _logger.LogError(ex, "Error occurred during login for user: {UserName} with data: {AuthData}",
                             request.UserName, loginData);
            return new() { Error = "Server Failure" };
        }
        finally
        {
            if (recordLoginAttempt)
            {
                await StoreLoginAttempt(loginSuccess, request.UserName, loginData);
            }
        }
    }

    public async Task<bool> UserHasAccessToEditOrg(int userId, UserRole role, int orgId)
    {
        User? user = await _userService.FindUserById(userId);

        if (user is null || user.Role != role)
        {
            _logger.LogWarning("UserId {UserId} with role {UserRole} was denied access to edit Organization[{OrgId}].",
                userId, role, orgId);
            return false;
        }

        if (role == UserRole.Admin)
        {
            _logger.LogInformation("Admin UserId {UserId} was granted access to edit Organization[{OrgId}].",
                userId, orgId);
            return true;
        }
        else if (role == UserRole.Sponsor)
        {
            Sponsor? sponsor = await _sponserService.GetSponsorByUserId(userId);
            bool hasAccess = (sponsor is not null && orgId == sponsor.SponsorId);
            if (hasAccess)
            {
                _logger.LogInformation("Sponsor UserId {UserId} was granted access to edit Organization[{OrgId}].",
                    userId, orgId);
            }
            else
            {
                _logger.LogWarning("Sponsor UserId {UserId} was denied access to edit Organization[{OrgId}] because they are not a sponsor of the organization.",
                    userId, orgId);
            }
            return hasAccess;
        }
        else
        {
            _logger.LogWarning("User: {UserData} was denied access to edit Organization[{OrgId}]", user, orgId);
            return false;
        }
    }

    public async Task<bool> UpdateUserPassword(string password, string? userName = null, int? userId = null)
    {
        try
        {
            User? updateUser = null;

            if (userName is not null)
            {
                _logger.LogInformation("Updating user {UserName} password.", userName);
                updateUser = await _userService.FindUserByName(userName)
                    ?? throw new("Failed to retrieve update user");
            }
            else if (userId is not null && userId != default)
            {
                _logger.LogInformation("Updating user[{Id}] password.", userId);
                updateUser = await _userService.FindUserById((int)userId)
                    ?? throw new("Failed to retrieve update user");
            }
            else
            {
                throw new("Received request to update user password but both username and userId were null");
            }

            string hashedPassword = HashPassword(updateUser, password);

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();

            MySqlCommand command = conn.CreateCommand();

            command.CommandText = $@"
                UPDATE {UsersTable.Name}
                SET {UserHashedPasswordField.SelectName} = @HashedPassword
                WHERE {UserIdField.SelectName} = @UserId;
            ";

            command.Parameters.Add(UserHashedPasswordField.GenerateParameter("@HashedPassword", hashedPassword));
            command.Parameters.Add(UserIdField.GenerateParameter("@UserId", updateUser.Id));

            int updateCount = await command.ExecuteNonQueryAsync();

            if (updateCount != 1)
            {
                _logger.LogError("Failed to update password for user {UserName}", updateUser.Username);
                return false;
            }
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating password for user: {ErrorMessage}", ex.Message);
            return false;
        }
    }

    #region Registration Methods
    public async Task<UserRead?> RegisterUserAsync(UserRequest request, RequestData registerData)
    {
        try
        {
            _logger.LogInformation("Creating user {UserName} from {RequestData}.",
                request.UserName, registerData);

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();

            MySqlCommand command = conn.CreateCommand();

            command.CommandText = $@"
                INSERT INTO {UsersTable.Name}
                ({UserUserNameField.SelectName}, {UserHashedPasswordField.SelectName}, {UserCreatedAtUtcField.SelectName})
                VALUES
                (@Username, '', @CreatedAtUtc);
            ";

            command.Parameters.Add(UserUserNameField.GenerateParameter("@Username", request.UserName));
            command.Parameters.Add(UserCreatedAtUtcField.GenerateParameter("@CreatedAtUtc", DateTime.UtcNow));

            await command.ExecuteNonQueryAsync();

            User newUser = await _userService.FindUserByName(request.UserName)
                ?? throw new("Failed to retrieve newly created user");

            string hashedPassword = HashPassword(newUser, request.Password);

            command.CommandText = $@"
                UPDATE {UsersTable.Name}
                SET {UserHashedPasswordField.SelectName} = @HashedPassword
                WHERE {UserIdField.SelectName} = @UserId;
            ";

            command.Parameters.Add(UserHashedPasswordField.GenerateParameter("@HashedPassword", hashedPassword));
            command.Parameters.Add(UserIdField.GenerateParameter("@UserId", newUser.Id));

            int updateCount = await command.ExecuteNonQueryAsync();

            if (updateCount != 1)
            {
                _logger.LogError("Failed to update password for user {UserName}", request.UserName);
                return null;
            }
            return newUser.ToReadFormat();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user {UserName}: {ErrorMessage}", request.UserName, ex.Message);
            return null;
        }
    }

    public async Task<Admin?> RegisterAdminUser(UserRequest request, RequestData registerData, int? creatorUserId = null)
    {
        try
        {
            _logger.LogInformation("Creating admin user {UserName} from {RequestData}.",
                request.UserName, registerData);
            UserRead newUser = await RegisterUserAsync(request, registerData)
                           ?? throw new("Failed to register new user");

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();

            MySqlCommand command = conn.CreateCommand();

            command.CommandText = $@"
                INSERT INTO {AdminsTable.Name}
                ({UserIdField.SelectName})
                VALUES
                (@UserId);
            ";

            command.Parameters.Add(UserIdField.GenerateParameter("@UserId", newUser.Id));

            await command.ExecuteNonQueryAsync();

            newUser.Role = UserRole.Admin.ToString();
            return new Admin
            {
                AdminId = (int)command.LastInsertedId,
                UserData = newUser
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating admin user {UserName}: {ErrorMessage}", request.UserName, ex.Message);
            return null;
        }
    }

    public async Task<Driver?> RegisterDriverUser(UserRequest request, RequestData registerData, int? creatorUserId = null)
    {
        try
        {
            _logger.LogInformation("Creating driver user {UserName} from {RequestData}.",
                request.UserName, registerData);
            UserRead newUser = await RegisterUserAsync(request, registerData)
                           ?? throw new("Failed to register new user");

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText = $@"
                INSERT INTO {DriversTable.Name}
                ({UserIdField.SelectName})
                VALUES
                (@UserId);
            ";

            command.Parameters.Add(UserIdField.GenerateParameter("@UserId", newUser.Id));

            await command.ExecuteNonQueryAsync();

            newUser.Role = UserRole.Driver.ToString();
            return new Driver
            {
                DriverId = (int)command.LastInsertedId,
                UserData = newUser
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating driver user {UserName}: {ErrorMessage}", request.UserName, ex.Message);
            return null;
        }
    }

    public async Task<Sponsor?> RegisterSponsorUser(UserRequest request, int orgId, int creatorUserId, RequestData registerData)
    {
        try
        {
            _logger.LogInformation("Creating sponsor user {UserName} to Org[{Org}] by UserId[{Id}] from {RequestData}.",
                request.UserName, orgId, creatorUserId, registerData);

            UserRead newUser = await RegisterUserAsync(request, registerData)
                           ?? throw new("Failed to register new user");

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            command.CommandText = $@"
                INSERT INTO {SponsorsTable.Name}
                ({UserIdField.SelectName}, {OrgIdField.SelectName})
                VALUES
                (@UserId, @OrgId);
            ";

            command.Parameters.Add(UserIdField.GenerateParameter("@UserId", newUser.Id));
            command.Parameters.Add(OrgIdField.GenerateParameter("@OrgId", orgId));

            await command.ExecuteNonQueryAsync();

            newUser.Role = UserRole.Sponsor.ToString();
            return new Sponsor
            {
                SponsorId = (int)command.LastInsertedId,
                OrganizationId = orgId,
                UserData = newUser
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating sponsor user {UserName}: {ErrorMessage}", request.UserName, ex.Message);
            return null;
        }
    }

    #endregion

    #region Token and Password Helpers
    private static string GenerateToken(User user, JwtSettings jwtSettings)
    {
        {
            List<Claim> claims =
            [
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Name, user.Username),
                new(ClaimTypes.Email, user.Email ?? ""),
                new(ClaimTypes.Role, user.Role.ToString()),
                // Iat stands for Issued At
                new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString())
            ];
            SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(jwtSettings.JwtKey));

            SigningCredentials creds = new(key, SecurityAlgorithms.HmacSha512);

            JwtSecurityToken tokenDescriptor = new(
                issuer: jwtSettings.Issuer,
                audience: jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: creds
                );

            return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
        }
    }

    private string HashPassword(User user, string password)
    {
        return _passwordHasher.HashPassword(user, password);
    }

    private bool VerifyPassword(User user, string password)
    {
        PasswordVerificationResult verificationResult =
            _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        return verificationResult != PasswordVerificationResult.Failed;
    }
    #endregion

    #region Login Attempt Tracking
    private async Task<int?> GetRecentLoginAttempts(RequestData requestData)
    {
        try
        {
            _logger.LogInformation("Retrieving recent logins at {Ip}", requestData.ClientIP);
            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            // Find all login attempts in the past x minutes
            command.CommandText =
                @$"SELECT COUNT(*) 
                   FROM {LoginAttemptsTable.Name}
                   WHERE {LoginAttemptDateField.SelectName} > @LoginWindow
                   AND {LoginAttemptIpField.SelectName} = @ClientIp";
            DateTime utc5MinutesAgo = DateTime.UtcNow.AddMinutes(-_appSettings.LoginAttemptWindowMinutes);
            command.Parameters.Add(LoginAttemptDateField.GenerateParameter("@LoginWindow", utc5MinutesAgo));
            command.Parameters.Add(LoginAttemptIpField.GenerateParameter("@ClientIp", requestData.ClientIP));

            object result = await command.ExecuteScalarAsync()
                ?? throw new Exception("Failed to retrieve login attempts from database");

            int loginCount = int.Parse(result.ToString()!);
            _logger.LogInformation("Found {Count} recent logins at {Ip}", loginCount, requestData.ClientIP);
            return loginCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error Getting Recent LoginAttempts for {Ip}. Error: {Err}",
                requestData.ClientIP, ex.Message);
            return null;
        }
    }

    private async Task StoreLoginAttempt(bool success, string username, RequestData requestData)
    {
        try
        {
            string loginStatus = success ? "Success" : "Failure";

            if (requestData.ClientIP.Equals(IPAddress.Loopback) || requestData.ClientIP.Equals(IPAddress.None))
            {
                _logger.LogInformation("Not Storing login attempt due to IP. User: {User}, Status: {Status}, IP: {Ip}",
                username, loginStatus, requestData.ClientIP);
                return;
            }

            _logger.LogInformation("Storing login attempt. User: {User}, Status: {Status}, IP: {Ip}",
                username, loginStatus, requestData.ClientIP);

            await using MySqlConnection conn = new(_dbConnection);
            conn.Open();
            MySqlCommand command = conn.CreateCommand();

            // Find all login attempts in the past x minutes
            command.CommandText =
            @$"INSERT INTO {LoginAttemptsTable.Name}
               ({LoginAttemptUserNameField.SelectName}, {LoginAttemptDateField.SelectName}, {LoginAttemptStatusField.SelectName}, {LoginAttemptIpField.SelectName})
               VALUES
               (@User, @Date, @Status, @Ip)";
            command.Parameters.Add(LoginAttemptUserNameField.GenerateParameter("@User", username));
            command.Parameters.Add(LoginAttemptDateField.GenerateParameter("@Date", DateTime.UtcNow));
            command.Parameters.Add(LoginAttemptStatusField.GenerateParameter("@Status", loginStatus));
            command.Parameters.Add(LoginAttemptIpField.GenerateParameter("@Ip", requestData.ClientIP));

            await command.ExecuteNonQueryAsync();

            _logger.LogInformation("Login attempt stored successfully for user {User} from IP {Ip}",
                username, requestData.ClientIP);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to store login attempt. User: {User}, IP: {Ip}, Request: {RequestData}",
                username, requestData.ClientIP, requestData);
        }
    }
    #endregion
}
