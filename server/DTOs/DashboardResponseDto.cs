namespace server.DTOs;

public class DashboardResponseDto
{
    public int TotalSkills { get; set; }

    public int TotalProjects { get; set; }

    public int TotalApplications { get; set; }

    public decimal AverageMatchScore { get; set; }

    public IReadOnlyDictionary<string, int> ApplicationsByStatus { get; set; }
        = new Dictionary<string, int>();

    public IReadOnlyList<MissingSkillSummaryDto> TopMissingSkills { get; set; } = [];

    public IReadOnlyList<JobApplicationResponseDto> RecentApplications { get; set; } = [];
}

public class MissingSkillSummaryDto
{
    public string Name { get; set; } = string.Empty;

    public int Count { get; set; }
}
