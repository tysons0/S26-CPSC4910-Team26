namespace Class4910Api.Models.Requests;

public class PointChangeRequest
{
    public required int OrgId { get; set; }
    public required int PointChange { get; set; }
    public string ChangeReason { get; set; } = string.Empty;
}
