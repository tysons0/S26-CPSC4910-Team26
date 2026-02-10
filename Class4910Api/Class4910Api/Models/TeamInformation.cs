namespace Class4910Api.Models;

public class TeamInformation
{
    public required string TeamName { get; set; }
    public required int TeamNumber { get; set; }
    public required string Version { get; set; }
    public required DateTime ReleaseDate { get; set; }
    public required string ProductName { get; set; }
    public required string ProductDescription { get; set; }
    public required List<string> TeamMembers { get; set; }

    override public string ToString()
    {
        return $"Team Name: {TeamName}\n" +
               $"Team Number: {TeamNumber}\n" +
               $"Version: {Version}\n" +
               $"Release Date: {ReleaseDate.ToShortDateString()}\n" +
               $"Product Name: {ProductName}\n" +
               $"Product Description: {ProductDescription}\n" +
               $"Team Members: {string.Join(", ", TeamMembers)}";
    }
}
