namespace Class4910Api.Configuration;

public class SendGridConfig
{
    public required string ApiKey { get; set; }
    public required string SendingEmail { get; set; }
    public required string SendingEmailName { get; set; }
}
