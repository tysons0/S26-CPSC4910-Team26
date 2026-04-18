namespace Class4910Api.Models;

public class PipeDelimitRow
{
    public required string Type { get; set; }   // O, D, S

    public string? OrganizationName { get; set; }

    public string? FirstName { get; set; } = string.Empty;

    public string? LastName { get; set; } = string.Empty;

    public string? Email { get; set; }

    public int? Points { get; set; }

    public string? ReasonForPoints { get; set; }

    public static PipeDelimitRow ParseLine(string line)
    {
        string[] parts = line.Split('|');
        string type = parts.ElementAtOrDefault(0) ?? "";
        string? orgName = parts.ElementAtOrDefault(1);
        string? firstName = parts.ElementAtOrDefault(2);
        string? lastName = parts.ElementAtOrDefault(3);
        string? email = parts.ElementAtOrDefault(4);
        int? points = int.TryParse(parts.ElementAtOrDefault(5), out var p) ? p : null;
        string? reason = parts.ElementAtOrDefault(6);


        return new PipeDelimitRow
        {
            Type = type.Trim(),
            OrganizationName = orgName?.Trim(),
            FirstName = firstName?.Trim(),
            LastName = lastName?.Trim(),
            Email = email?.Trim(),
            Points = points,
            ReasonForPoints = reason
        };
    }

    public override string ToString()
    {
        return $"Type: {Type}, Org: {OrganizationName}, Name: {FirstName} {LastName}, Email: {Email}, Points: {Points}, Reason: {ReasonForPoints}";
    }
}
