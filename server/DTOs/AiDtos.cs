using System.ComponentModel.DataAnnotations;

namespace server.DTOs;

public sealed class ApplicationExtractionRequestDto
{
    [StringLength(30000)]
    public string Text { get; set; } = string.Empty;

    [StringLength(2048)]
    public string? Url { get; set; }
}

public sealed class ExtractedRequirementDto
{
    public string Name { get; set; } = string.Empty;

    public bool IsRequired { get; set; }
}

public sealed class ExtractedApplicationDto
{
    public string? Company { get; set; }

    public string? Position { get; set; }

    public string? JobUrl { get; set; }

    public string? Location { get; set; }

    public decimal? Salary { get; set; }

    public string? AppliedAt { get; set; }

    public string? InterviewAt { get; set; }

    public string? JobDescription { get; set; }

    public string? Notes { get; set; }

    public List<ExtractedRequirementDto> Requirements { get; set; } = [];
}

public sealed class AiApplicationExtractionResponseDto
{
    public ExtractedApplicationDto Application { get; set; } = new();
}

public sealed class AiJobAnalysisRequestDto
{
    public int? ApplicationId { get; set; }

    [StringLength(30000)]
    public string? JobText { get; set; }

    [StringLength(2048)]
    public string? Url { get; set; }
}

public sealed class AiJobAnalysisResponseDto
{
    public bool IsJobPosting { get; set; }

    public string Summary { get; set; } = string.Empty;

    public string Explanation { get; set; } = string.Empty;

    public decimal MatchScore { get; set; }

    public List<string> MatchedSkills { get; set; } = [];

    public List<string> MissingRequiredSkills { get; set; } = [];

    public List<string> MissingOptionalSkills { get; set; } = [];

    public List<ExtractedRequirementDto> DetectedRequirements { get; set; } = [];

    public List<string> RoadmapSkills { get; set; } = [];

    public ExtractedApplicationDto? ExtractedApplication { get; set; }
}
