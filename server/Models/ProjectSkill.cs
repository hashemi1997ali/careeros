namespace server.Models;

public class ProjectSkill
{
    public int ProjectId { get; set; }

    public Project Project { get; set; } = null!;

    public int UserSkillId { get; set; }

    public UserSkill UserSkill { get; set; } = null!;
}
