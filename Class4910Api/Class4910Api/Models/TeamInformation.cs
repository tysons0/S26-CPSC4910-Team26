namespace Class4910Api.Models;

public class TeamInformation
{
    public required int TeamNumber { get; set; }
    public required string Version { get; set; }
    public required DateTime ReleaseDate { get; set; }
    public required string ProductName { get; set; }
    public required string ProductDescription { get; set; }

    override public string ToString()
    {
        return $"TeamInformation[TeamNumber={TeamNumber}, Version={Version}, ReleaseDate={ReleaseDate}, ProductName={ProductName}, ProductDescription={ProductDescription}]";
    }
}
