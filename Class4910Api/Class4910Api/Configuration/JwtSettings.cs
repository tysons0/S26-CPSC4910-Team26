namespace Class4910Api.Configuration;

public class JwtSettings
{
    public required string Audience { get; set; }
    public required string Issuer { get; set; }
    public required string JwtKey { get; set; }
}
