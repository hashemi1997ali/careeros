namespace server.Models;

public class JobPosting
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public User? User { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Company { get; set; } = string.Empty;

    public string? Location { get; set; }

    public string? Url { get; set; }

    public string? Description { get; set; }

    public List<string> RequiredSkills { get; set; } = new();

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
