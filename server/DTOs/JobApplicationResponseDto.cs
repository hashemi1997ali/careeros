using server.Models;

namespace server.DTOs;

public class JobApplicationResponseDto
{
    public int Id { get; set; }

    public string Company { get; set; } = string.Empty;

    public string Position { get; set; } = string.Empty;

    public string? JobUrl { get; set; }

    public string? Location { get; set; }

    public decimal? Salary { get; set; }

    public JobApplicationStatus Status { get; set; }

    public DateTime? AppliedAt { get; set; }

    public DateTime? InterviewAt { get; set; }

    public string? Notes { get; set; }

    public string? JobDescription { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public IReadOnlyList<JobRequirementResponseDto> Requirements { get; set; } = [];
}
