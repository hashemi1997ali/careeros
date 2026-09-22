using System.ComponentModel.DataAnnotations;
using server.Models;

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
    [EnumDataType(typeof(SkillLevel))]
    public SkillLevel? Level { get; set; }

    public DateOnly? StartDate { get; set; }
}
