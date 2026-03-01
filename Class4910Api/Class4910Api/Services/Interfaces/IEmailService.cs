using SendGrid.Helpers.Mail;

namespace Class4910Api.Services.Interfaces;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent);
}
