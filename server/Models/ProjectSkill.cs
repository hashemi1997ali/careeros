namespace server.Models;

public class ProjectSkill
{
    public int ProjectId { get; set; }

    public Project Project { get; set; } = null!;

    public int SkillId { get; set; }

    public Skill Skill { get; set; } = null!;
}
