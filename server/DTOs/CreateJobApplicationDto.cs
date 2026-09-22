using System.ComponentModel.DataAnnotations;
using server.Models;

namespace server.DTOs;

public class CreateJobApplicationDto
{
    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string Company { get; set; } = string.Empty;

    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string Position { get; set; } = string.Empty;

    [Url]
    [StringLength(2048)]
    public string? JobUrl { get; set; }

    [StringLength(150)]
    public string? Location { get; set; }

    [Range(0, 10000000)]
    public decimal? Salary { get; set; }

    [EnumDataType(typeof(JobApplicationStatus))]
    public JobApplicationStatus Status { get; set; } = JobApplicationStatus.Saved;

    public DateTime? AppliedAt { get; set; }

    public DateTime? InterviewAt { get; set; }

    [StringLength(3000)]
    public string? Notes { get; set; }

    [StringLength(3000)]
    public string? JobDescription { get; set; }

    [MaxLength(50)]
    public List<JobRequirementDto> Requirements { get; set; } = [];
}
