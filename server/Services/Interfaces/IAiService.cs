using server.DTOs;

namespace server.Services.Interfaces;

public interface IAiService
{
    Task<ExtractedApplicationDto> ExtractApplicationAsync(
        string sourceText,
        CancellationToken cancellationToken);

    Task<AiJobAnalysisResponseDto> AnalyzeJobAsync(
        string jobText,
        IReadOnlyList<SkillResponseDto> skills,
        JobApplicationResponseDto? application,
        CancellationToken cancellationToken);
}
