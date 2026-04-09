namespace Class4910Api.Models.Reports;

public class AuditLogReportRequest
{
    public int? UserId { get; init; }
    public int? OrgId { get; init; }
    public int? SponsorId { get; init; }
    public LogType Type { get; init; }

}


public enum LogType
{
    All,
    PasswordChanges,
    LoginAttempts,
    Applications
}