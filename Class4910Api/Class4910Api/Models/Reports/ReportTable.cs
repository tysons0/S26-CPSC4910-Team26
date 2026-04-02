namespace Class4910Api.Models.Reports;

public class ReportTable
{
    public required List<string> Headers { get; init; }
    public required List<List<object>> Rows { get; init; }
}