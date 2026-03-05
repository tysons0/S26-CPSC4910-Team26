using Microsoft.AspNetCore.Mvc;
using Class4910Api.Services;
using Class4910Api.Models.Requests;

namespace Class4910Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmailController : ControllerBase
    {
        private readonly EmailService _emailService;

        public EmailController(EmailService emailService)
        {
            _emailService = emailService;
        }

        // FORGOT PASSWORD
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var token = Guid.NewGuid().ToString();

            // TODO: save token to database

            var resetLink = $"http://localhost:3000/reset-password?token={token}";

            await _emailService.SendEmailAsync(
                request.Email,
                "Reset Your Password",
                $"Click this link to reset your password:\n{resetLink}"
            );

            return Ok("Password reset email sent.");
        }

        // RESET PASSWORD
        [HttpPost("reset-password")]
        public IActionResult ResetPassword([FromBody] ResetPasswordRequest request)
        {
            // TODO:
            // validate token
            // find user
            // update password

            return Ok("Password successfully reset.");
        }

        // EMAIL VERIFICATION
        [HttpPost("send-verification")]
        public async Task<IActionResult> SendVerification([FromBody] RegisterRequest request)
        {
            var token = Guid.NewGuid().ToString();

            // TODO: save verification token

            var verifyLink = $"http://localhost:3000/verify-email?token={token}";

            await _emailService.SendEmailAsync(
                request.Email,
                "Verify your email",
                $"Click this link to verify your email:\n{verifyLink}"
            );

            return Ok("Verification email sent.");
        }

        // GENERIC NOTIFICATION EMAIL
        [HttpPost("send-notification")]
        public async Task<IActionResult> SendNotification(string email, string subject, string message)
        {
            await _emailService.SendEmailAsync(email, subject, message);

            return Ok("Notification email sent.");
        }
    }
}
