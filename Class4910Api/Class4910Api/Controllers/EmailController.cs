using System.Security.Cryptography;
using Class4910Api.Models;
using Class4910Api.Models.Requests;
using Class4910Api.Configuration;
using Class4910Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;


namespace Class4910Api.Controllers

{
    [ApiController]
    [Route("[controller]")]
    public class EmailController : ControllerBase
    {
        private const string PasswordResetTokensTable = "PasswordResetTokens";
        private readonly IEmailService _emailService;
        private readonly IUserService _userService;
        private readonly IAuthService _authService;
        private readonly string _dbConnection;

        public EmailController(IEmailService emailService, IUserService userService, IAuthService authService,
            IOptions<DatabaseConnection> databaseConnection)
        {
            _emailService = emailService;
            _userService = userService;
            _authService = authService;
            _dbConnection = databaseConnection.Value.Connection;
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            User? user = await _userService.FindUserByEmail(request.Email);

            if (user == null)
                return NotFound("No account found with that email address.");

            byte[] tokenBytes = RandomNumberGenerator.GetBytes(32);
            string token = Convert.ToHexString(tokenBytes).ToLowerInvariant();
            string tokenHash = HashToken(token);
            DateTime expiry = DateTime.UtcNow.AddMinutes(30);

            bool tokenStored = await SaveResetTokenAsync(request.Email, tokenHash, expiry);
            if (!tokenStored)
                return StatusCode(500, "Failed to issue reset token.");

            string resetLink = $"https://main.d29jdyt23lpjjz.amplifyapp.com/reset-password?token={token}&username={Uri.EscapeDataString(user.Username)}";

            bool sent = await _emailService.SendEmailAsync(
                request.Email,
                "Reset Your Password",
                $"<p>Click the link below to reset your password. This link expires in 30 minutes.</p><a href='{resetLink}'>{resetLink}</a>"
            );
            if (!sent)
            {
                return StatusCode(500, "Failed to send reset email.");
            }
            return Ok("Password reset email sent.");
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            string tokenHash = HashToken(request.Token);

            ResetTokenEntry? entry = await GetActiveTokenEntryAsync(tokenHash);
            if (entry is null)
                return BadRequest("Invalid or expired reset token.");

            if (DateTime.UtcNow > entry.Expiry)
            {
                await MarkTokenUsedAsync(tokenHash);
                return BadRequest("Reset token has expired.");
            }

            // Look up user by email to get their ID
            User? user = await _userService.FindUserByEmail(entry.Email);
            if (user == null)
                return NotFound("User no longer exists.");

            bool success = await _authService.UpdateUserPassword(request.NewPassword, userId: user.Id);
            if (!success)
                return StatusCode(500, "Failed to update password.");

            await MarkTokenUsedAsync(tokenHash);
            return Ok("Password successfully reset.");
        }

        private static string HashToken(string token)
        {
            byte[] hashBytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }

        private async Task<bool> SaveResetTokenAsync(string email, string tokenHash, DateTime expiry)
        {
            try
            {
                DateTime now = DateTime.UtcNow;

                await using MySqlConnection conn = new(_dbConnection);
                await conn.OpenAsync();

                await using MySqlCommand cmd = conn.CreateCommand();
                cmd.CommandText = $@"
                    UPDATE {PasswordResetTokensTable}
                    SET UsedAtUtc = @UsedAtUtc
                    WHERE Email = @Email AND UsedAtUtc IS NULL;

                    INSERT INTO {PasswordResetTokensTable}
                    (TokenHash, Email, ExpiresAtUtc, CreatedAtUtc, UsedAtUtc)
                    VALUES
                    (@TokenHash, @Email, @ExpiresAtUtc, @CreatedAtUtc, NULL);
                ";

                cmd.Parameters.AddWithValue("@UsedAtUtc", now);
                cmd.Parameters.AddWithValue("@Email", email);
                cmd.Parameters.AddWithValue("@TokenHash", tokenHash);
                cmd.Parameters.AddWithValue("@ExpiresAtUtc", expiry);
                cmd.Parameters.AddWithValue("@CreatedAtUtc", now);

                await cmd.ExecuteNonQueryAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        private async Task<ResetTokenEntry?> GetActiveTokenEntryAsync(string tokenHash)
        {
            await using MySqlConnection conn = new(_dbConnection);
            await conn.OpenAsync();

            await using MySqlCommand cmd = conn.CreateCommand();
            cmd.CommandText = $@"
                SELECT Email, ExpiresAtUtc
                FROM {PasswordResetTokensTable}
                WHERE TokenHash = @TokenHash AND UsedAtUtc IS NULL
                LIMIT 1;
            ";
            cmd.Parameters.AddWithValue("@TokenHash", tokenHash);

            await using MySqlDataReader reader = (MySqlDataReader)await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
                return null;

            string email = reader.GetString(0);
            DateTime expiry = reader.GetDateTime(1);
            return new ResetTokenEntry(email, expiry);
        }

        private async Task MarkTokenUsedAsync(string tokenHash)
        {
            await using MySqlConnection conn = new(_dbConnection);
            await conn.OpenAsync();

            await using MySqlCommand cmd = conn.CreateCommand();
            cmd.CommandText = $@"
                UPDATE {PasswordResetTokensTable}
                SET UsedAtUtc = @UsedAtUtc
                WHERE TokenHash = @TokenHash AND UsedAtUtc IS NULL;
            ";
            cmd.Parameters.AddWithValue("@UsedAtUtc", DateTime.UtcNow);
            cmd.Parameters.AddWithValue("@TokenHash", tokenHash);

            await cmd.ExecuteNonQueryAsync();
        }

        private sealed record ResetTokenEntry(string Email, DateTime Expiry);
    }
}