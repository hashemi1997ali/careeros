using System.ComponentModel.DataAnnotations;
using server.Models;

namespace server.Dtos;

public record JobPostingDto(
    Guid Id,
    string Title,
    string Company,
    string? Location,
    string? Url,
    string? Description,
    IReadOnlyList<string> RequiredSkills,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt)
{
    public static JobPostingDto From(JobPosting job) => new(
        job.Id,
        job.Title,
        job.Company,
        job.Location,
        job.Url,
        job.Description,
        job.RequiredSkills,
        job.CreatedAt,
        job.UpdatedAt);
}

public class JobPostingInput
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Company { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Location { get; set; }

    [MaxLength(2000)]
    public string? Url { get; set; }

    [MaxLength(20000)]
    public string? Description { get; set; }

    public List<string> RequiredSkills { get; set; } = new();
}
