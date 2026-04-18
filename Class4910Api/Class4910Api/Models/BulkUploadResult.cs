using System.Collections.Generic;
using System.Text;

namespace Class4910Api.Models
{
    public class BulkUploadResult
    {
        public List<string> Successes { get; set; } = [];
        public List<string> Errors { get; set; } = [];

        public int TotalLines { get; set; } = 0;

        public override string ToString()
        {
            StringBuilder sb = new();

            sb.AppendLine($"TotalLines: {TotalLines}");
            sb.AppendLine($"Successes: {Successes?.Count ?? 0}");
            sb.AppendLine($"Errors: {Errors?.Count ?? 0}");

            if (Successes != null && Successes.Count > 0)
            {
                sb.AppendLine("Successful items:");
                for (int i = 0; i < Successes.Count; i++)
                {
                    sb.AppendLine($"  {i + 1}. {Successes[i]}");
                }
            }

            if (Errors != null && Errors.Count > 0)
            {
                sb.AppendLine("Errors:");
                for (int i = 0; i < Errors.Count; i++)
                {
                    sb.AppendLine($"  {i + 1}. {Errors[i]}");
                }
            }

            return sb.ToString().TrimEnd();
        }
    }
}
