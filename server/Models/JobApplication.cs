namespace server.Models;

public class JobApplication
{
    public int Id { get; set; }

    public Guid UserId { get; set; }

    public User? User { get; set; }

    public string Company { get; set; } = string.Empty;

    public string Position { get; set; } = string.Empty;

    public string? JobUrl { get; set; }

    public string? Location { get; set; }

    public decimal? Salary { get; set; }

    public JobApplicationStatus Status { get; set; } = JobApplicationStatus.Saved;

    public DateTime? AppliedAt { get; set; }

    public DateTime? InterviewAt { get; set; }

    public string? Notes { get; set; }

    public string? JobDescription { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<JobRequirement> Requirements { get; set; } = [];
}
