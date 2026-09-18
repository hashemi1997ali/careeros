using System.ComponentModel.DataAnnotations;

namespace server.DTOs;

public class JobRequirementDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    public bool IsRequired { get; set; } = true;

    [Range(1, 5)]
    public int Weight { get; set; } = 1;
}
