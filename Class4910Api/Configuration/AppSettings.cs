namespace Class4910Api.Configuration;

public class AppSettings
{
    public required int MaxLoginAttempts { get; init; }
    public required int LoginAttemptWindowMinutes { get; init; }
}
