namespace server.Models;

public class Skill
{
    public int Id { get; set; }

    public Guid UserId { get; set; }

    public User? User { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public SkillLevel Level { get; set; }

    public ICollection<ProjectSkill> ProjectSkills { get; set; } = [];
}
