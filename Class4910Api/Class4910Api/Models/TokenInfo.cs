namespace Class4910Api.Models;

public class TokenInfo
{
    public required DateTimeOffset Expiration { get; init; }
    public required DateTimeOffset IssuedAt { get; init; }

    public bool IsExpired => DateTimeOffset.UtcNow >= Expiration;

    public double SecondsUntilExpiration => (Expiration - DateTimeOffset.UtcNow).TotalSeconds;

    public double MinutesUntilExpiration => SecondsUntilExpiration / 60.0;

    public double HoursUntilExpiration =>
        MinutesUntilExpiration / 60.0;
}
