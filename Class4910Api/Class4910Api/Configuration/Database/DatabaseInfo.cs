namespace Class4910Api.Configuration.Database;

using System.Data;
using Class4910Api.Models;
using MySql.Data.MySqlClient;

public class DatabaseTable
{
    public required string Name { get; init; }

    public required List<DatabaseField> Fields { get; init; }

    public string GenerateSelect()
    {
        return $"SELECT {string.Join(", ", Fields.Select(f => f.SelectName))} FROM `{Name}`";
    }
    public string GetFields(string alias)
    {
        return $"{string.Join(", ", Fields.Select(f => $"{alias}.{f.SelectName} as {alias}_{f.Name}"))}";
    }
}

public class DatabaseField
{
    public required string Name { get; init; }
    public string SelectName => $"`{Name}`";

    public required MySqlDbType Type { get; init; }
    public required bool Nullable { get; init; }

    public MySqlParameter GenerateParameter(string paramName, object value)
    {
        return new MySqlParameter()
        {
            ParameterName = paramName,
            MySqlDbType = Type,
            Value = value ?? DBNull.Value
        };
    }
}
