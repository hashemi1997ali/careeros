namespace server.Models;

public class User
{
    public Guid Id { get; set; }

    public string AuthSub { get; set; } = string.Empty;

    public string? Email { get; set; }

    public string? DisplayName { get; set; }

    public string? PictureUrl { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public DateTimeOffset? LastLoginAt { get; set; }

    public ICollection<UserSkill> Skills { get; set; } = new List<UserSkill>();

    public ICollection<Project> Projects { get; set; } = new List<Project>();

    public ICollection<JobApplication> JobApplications { get; set; } = new List<JobApplication>();
}
