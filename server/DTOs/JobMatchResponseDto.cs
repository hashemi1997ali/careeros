namespace server.DTOs;

public class JobMatchResponseDto
{
    public int JobApplicationId { get; set; }

    public decimal MatchScore { get; set; }

    public bool HasRequirements { get; set; }

    public IReadOnlyList<string> MatchedSkills { get; set; } = [];

    public IReadOnlyList<string> MissingRequiredSkills { get; set; } = [];

    public IReadOnlyList<string> MissingOptionalSkills { get; set; } = [];
}
