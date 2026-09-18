namespace server.Models;

public class Skill
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public SkillLevel Level { get; set; }

    public ICollection<ProjectSkill> ProjectSkills { get; set; } = [];
}
