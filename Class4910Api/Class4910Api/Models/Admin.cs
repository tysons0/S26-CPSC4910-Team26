namespace Class4910Api.Models;

public class Admin
{
    public required int AdminId { get; init; }
    public required UserRead UserData { get; init; }

    public override string ToString()
    {
        return $"Admin[AdminId: {AdminId}, {UserData}]";
    }
}
