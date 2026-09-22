using server.Models;

namespace server.DTOs;

public class SkillResponseDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public SkillLevel Level { get; set; }

    public DateOnly? StartDate { get; set; }

    public List<SkillProjectDto> Projects { get; set; } = [];
}

public class SkillProjectDto
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;
}
