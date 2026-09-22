namespace server.DTOs;

public class ProjectResponseDto
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? RepositoryUrl { get; set; }

    public string? LiveUrl { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public IReadOnlyList<SkillResponseDto> Skills { get; set; } = [];
}
