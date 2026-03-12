namespace Class4910Api.Models.Requests;

public class PointChangeRequest
{
    public int PointChange { get; set; }
    public string ChangeReason { get; set; } = string.Empty;
}
