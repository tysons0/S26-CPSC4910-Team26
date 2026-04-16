namespace Class4910Api.Models;

public class BulkUploadResult
{
    public List<string> Successes { get; set; } = [];
    public List<string> Errors { get; set; } = [];

    public int TotalLines { get; set; } = 0;
}
