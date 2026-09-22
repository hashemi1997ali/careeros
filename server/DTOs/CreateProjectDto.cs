using System.ComponentModel.DataAnnotations;

namespace server.DTOs;

public class CreateProjectDto
{
    [Required]
    [StringLength(150, MinimumLength = 2)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(4000, MinimumLength = 10)]
    public string Description { get; set; } = string.Empty;

    [Url]
    [StringLength(2048)]
    public string? RepositoryUrl { get; set; }

    [Url]
    [StringLength(2048)]
    public string? LiveUrl { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public List<int> SkillIds { get; set; } = [];
}
