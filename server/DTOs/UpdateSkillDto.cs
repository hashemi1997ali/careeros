using System.ComponentModel.DataAnnotations;

namespace server.DTOs;

public class UpdateSkillDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(50, MinimumLength = 2)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [RegularExpression(
        "^(Beginner|Intermediate|Advanced)$",
        ErrorMessage = "Level must be Beginner, Intermediate, or Advanced."
    )]
    public string Level { get; set; } = string.Empty;
}