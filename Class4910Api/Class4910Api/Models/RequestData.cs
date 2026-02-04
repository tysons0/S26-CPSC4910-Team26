using System.Net;

namespace Class4910Api.Models;

public class RequestData
{
    public required IPAddress ClientIP { get; set; }
    public required string UserAgent { get; set; }

    public override string ToString()
    {
        return $"Request Data: [IP:{ClientIP}, UserAgent:{UserAgent}]";
    }
}
