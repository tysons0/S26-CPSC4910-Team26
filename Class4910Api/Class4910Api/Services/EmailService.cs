using SendGrid;
using SendGrid.Helpers.Mail;

public class EmailService
{
    private readonly string _apiKey;

    public EmailService(IConfiguration config)
    {
        _apiKey = config["SENDGRID:API_key"];
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlContent)
    {
        var client = new SendGridClient(_apiKey);
        var from = new EmailAddress("team26cpsc4910@gmail.com", "Driver Incentive Program");
        var to = new EmailAddress(toEmail);

        var msg = MailHelper.CreateSingleEmail(from, to, subject, "", htmlContent);
        var response = await client.SendEmailAsync(msg);

        if (!response.IsSuccessStatusCode)
            throw new Exception("Email failed to send.");
    }
}
