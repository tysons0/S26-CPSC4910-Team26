using Microsoft.AspNetCore.Mvc;
using Class4910Api.Services.Interfaces;
using Class4910Api.Models.Requests;
using System.Collections.Concurrent;


namespace Class4910Api.Controllers

{
    [ApiController]
    [Route("api/[controller]")]
    public class EmailController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly IUserService _userService;
        private readonly IAuthService _authService;

        // In-memory token store: token -> (email, expiry)
        private static readonly ConcurrentDictionary<string, (string Email, DateTime Expiry)> _resetTokens = new();

        public EmailController(IEmailService emailService, IUserService userService, IAuthService authService)
        {
            _emailService = emailService;
            _userService = userService;
            _authService = authService;
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var user = await _userService.FindUserByEmail(request.Email);

            if (user == null)
                return NotFound("No account found with that email address.");

            var token = Guid.NewGuid().ToString();
            var expiry = DateTime.UtcNow.AddMinutes(30);

            _resetTokens[token] = (request.Email, expiry);

            var resetLink = $"http://localhost:5173/reset-password?token={token}&username={Uri.EscapeDataString(user.Username)}";

            await _emailService.SendEmailAsync(
                request.Email,
                "Reset Your Password",
                $"<p>Click the link below to reset your password. This link expires in 30 minutes.</p><a href='{resetLink}'>{resetLink}</a>"
            );

            return Ok("Password reset email sent.");
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!_resetTokens.TryGetValue(request.Token, out var entry))
                return BadRequest("Invalid or expired reset token.");

            if (DateTime.UtcNow > entry.Expiry)
            {
                _resetTokens.TryRemove(request.Token, out _);
                return BadRequest("Reset token has expired.");
            }

            // Look up user by email to get their ID
            var user = await _userService.FindUserByEmail(entry.Email);
            if (user == null)
                return NotFound("User no longer exists.");

            var success = await _authService.UpdateUserPassword(request.NewPassword, userId: user.Id);
            if (!success)
                return StatusCode(500, "Failed to update password.");

            _resetTokens.TryRemove(request.Token, out _);
            return Ok("Password successfully reset.");
        }
    }
}