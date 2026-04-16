namespace Class4910Api.Models;

public class PipeDelimitRow
{
    public required string Type { get; set; }   // O, D, S

    public string? OrganizationName { get; set; }

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public string? Email { get; set; }

    public int? Points { get; set; }

    public string? ReasonForPoints { get; set; }

    public static PipeDelimitRow ParseLine(string line)
    {
        var parts = line.Split('|');

        return new PipeDelimitRow
        {
            Type = parts.ElementAtOrDefault(0) ?? "",
            OrganizationName = parts.ElementAtOrDefault(1),
            FirstName = parts.ElementAtOrDefault(2),
            LastName = parts.ElementAtOrDefault(3),
            Email = parts.ElementAtOrDefault(4),
            Points = int.TryParse(parts.ElementAtOrDefault(5), out var p) ? p : null,
            ReasonForPoints = parts.ElementAtOrDefault(6)
        };
    }
}
