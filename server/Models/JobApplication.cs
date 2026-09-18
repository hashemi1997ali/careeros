namespace server.Models;

public class JobApplication
{
    public int Id { get; set; }

    public Guid? UserId { get; set; }

    public User? User { get; set; }

    public string Company { get; set; } = string.Empty;

    public string Position { get; set; } = string.Empty;

    public string? JobUrl { get; set; }

    public string? Location { get; set; }

    public decimal? Salary { get; set; }

    public JobApplicationStatus Status { get; set; } = JobApplicationStatus.Saved;

    public DateTime? AppliedAtUtc { get; set; }

    public DateTime? InterviewAtUtc { get; set; }

    public string? Notes { get; set; }

    public string? JobDescription { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    public ICollection<JobRequirement> Requirements { get; set; } = [];
}
