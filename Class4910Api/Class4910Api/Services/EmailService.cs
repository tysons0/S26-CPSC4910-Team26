using Class4910Api.Configuration;
using Class4910Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace Class4910Api.Services;

public class EmailService : IEmailService
{
    private readonly string _apiKey;
    private readonly ILogger<EmailService> _logger;
    private readonly EmailAddress _sendingEmailAddress;
    public EmailService(ILogger<EmailService> logger, IOptions<SendGridConfig> sendGridConfigOptions)
    {
        SendGridConfig sendGridConfig = sendGridConfigOptions.Value;
        _apiKey = sendGridConfig.ApiKey;
        _logger = logger;
        _sendingEmailAddress = new(sendGridConfig.SendingEmail, sendGridConfig.SendingEmailName);
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent)
    {
        try
        {
            SendGridClient client = new(_apiKey);
            EmailAddress to = new(toEmail);

            SendGridMessage msg = MailHelper.CreateSingleEmail(_sendingEmailAddress, to, subject, "", htmlContent);
            Response response = await client.SendEmailAsync(msg);

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Response was [{response.StatusCode}]");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending Sendgrid Email: {Error}", ex.Message);
            return false;
        }
    }
}

