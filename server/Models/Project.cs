namespace server.Models;

public class Project
{
    public int Id { get; set; }

    public Guid UserId { get; set; }

    public User? User { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? RepositoryUrl { get; set; }

    public string? LiveUrl { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    public ICollection<ProjectSkill> ProjectSkills { get; set; } = [];
}
