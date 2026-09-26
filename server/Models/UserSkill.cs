namespace server.Models;

public class UserSkill
{
    public int Id { get; set; }

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public int SkillId { get; set; }

    public Skill Skill { get; set; } = null!;

    public SkillLevel Level { get; set; }

    public DateOnly? StartDate { get; set; }

    public ICollection<ProjectSkill> ProjectSkills { get; set; } = [];
}
