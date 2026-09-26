namespace server.Models;

public class Skill
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string CategorySlug { get; set; } = string.Empty;

    public ICollection<UserSkill> UserSkills { get; set; } = [];
}
