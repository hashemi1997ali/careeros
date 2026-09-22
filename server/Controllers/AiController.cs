using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;
using server.DTOs;
using server.Exceptions;
using server.Services.Interfaces;

namespace server.Controllers;

[ApiController]
[Authorize]
[Route("api/ai")]
public sealed class AiController(
    IAiService aiService,
    ISkillService skillService,
    IJobApplicationService jobApplicationService,
    IJobPageFetcher jobPageFetcher) : ControllerBase
{

    [HttpPost("application-extract")]
    [ProducesResponseType<AiApplicationExtractionResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<AiApplicationExtractionResponseDto>> ExtractApplication(
        ApplicationExtractionRequestDto request,
        CancellationToken cancellationToken)
    {
        var pastedText = request.Text?.Trim() ?? string.Empty;
        var urlCandidate = FirstUrl(request.Url) ?? FirstUrl(pastedText);
        var url = string.IsNullOrWhiteSpace(pastedText) || ShouldFetchUrl(pastedText)
            ? urlCandidate
            : null;
        var fetched = url is null
            ? null
            : await jobPageFetcher.FetchAsync(url, cancellationToken);
        var sourceText = CombineSource(pastedText, fetched?.Text);

        if (!HasMeaningfulText(sourceText))
        {
            return BadRequest(new
            {
                error = "job_context_unavailable",
                message = fetched?.ErrorMessage ?? "Paste job details or provide a readable job posting URL."
            });
        }

        var application = await aiService.ExtractApplicationAsync(sourceText, cancellationToken);
        return Ok(new AiApplicationExtractionResponseDto { Application = application });
    }

    [HttpPost("job-analyze")]
    [ProducesResponseType<AiJobAnalysisResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<AiJobAnalysisResponseDto>> AnalyzeJob(
        AiJobAnalysisRequestDto request,
        CancellationToken cancellationToken)
    {
        var jobText = request.JobText?.Trim() ?? string.Empty;
        var application = request.ApplicationId.HasValue
            ? await jobApplicationService.GetByIdAsync(request.ApplicationId.Value, cancellationToken)
            : null;

        if (request.ApplicationId.HasValue && application is null)
        {
            throw new ResourceNotFoundException("Job application", request.ApplicationId.Value);
        }

        var applicationText = application is null
            ? string.Empty
            : string.Join(
                Environment.NewLine,
                new[]
                {
                    $"Application id: {application.Id}",
                    $"Company: {application.Company}",
                    $"Position: {application.Position}",
                    $"Job URL: {application.JobUrl}",
                    $"Location: {application.Location}",
                    $"Salary: {application.Salary}",
                    $"Status: {application.Status}",
                    $"Applied at: {application.AppliedAt}",
                    $"Interview at: {application.InterviewAt}",
                    application.JobDescription,
                    application.Notes,
                    string.Join(
                        Environment.NewLine,
                        application.Requirements.Select(requirement =>
                            $"Requirement {requirement.Id}: {requirement.Name} ({(requirement.IsRequired ? "required" : "optional")})")),
                    $"Created at: {application.CreatedAt}",
                    $"Updated at: {application.UpdatedAt}"
                }.Where(value => !string.IsNullOrWhiteSpace(value)));

        var urlCandidate = FirstUrl(request.Url) ?? FirstUrl(jobText);
        var url = request.ApplicationId.HasValue || (!string.IsNullOrWhiteSpace(jobText) && !ShouldFetchUrl(jobText))
            ? null
            : urlCandidate;
        var fetched = url is null
            ? null
            : await jobPageFetcher.FetchAsync(url, cancellationToken);
        var sourceText = CombineSource(jobText, applicationText, fetched?.Text);
        if (!HasMeaningfulText(sourceText))
        {
            return BadRequest(new
            {
                error = "job_context_unavailable",
                message = fetched?.ErrorMessage ?? "Paste a job description or select an application with saved requirements."
            });
        }

        var skills = await skillService.GetAllAsync(null, null, null, cancellationToken);
        return Ok(new
        {
            analysis = await aiService.AnalyzeJobAsync(sourceText, skills, application, cancellationToken),
            applicationId = request.ApplicationId
        });
    }

    private static string? FirstUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var match = Regex.Match(value, "https?://[^\\s<>\"']+", RegexOptions.IgnoreCase);
        return match.Success
            ? match.Value.TrimEnd('.', ',', ';', ')', ']', '}')
            : null;
    }

    private static bool ShouldFetchUrl(string? text)
    {
        var url = FirstUrl(text);
        if (url is null)
        {
            return false;
        }

        var withoutUrls = Regex.Replace(text!, "https?://[^\\s<>\"']+", " ", RegexOptions.IgnoreCase);
        var normalized = Regex.Replace(withoutUrls, @"\s+", " ").Trim();
        if (normalized.Length < 200)
        {
            return true;
        }

        if (normalized.Length >= 400)
        {
            return false;
        }

        var jobSignals = new[]
        {
            "job description", "responsibilities", "requirements", "qualifications",
            "experience", "we are looking", "about the role", "apply now", "salary"
        };
        return jobSignals.Count(signal => normalized.Contains(signal, StringComparison.OrdinalIgnoreCase)) < 2;
    }

    private static string CombineSource(params string?[] values) => string.Join(
        Environment.NewLine + Environment.NewLine,
        values.Where(value => !string.IsNullOrWhiteSpace(value)).Select(value => value!.Trim()));

    private static bool HasMeaningfulText(string value)
    {
        var withoutUrls = Regex.Replace(value, "https?://[^\\s<>\"']+", " ", RegexOptions.IgnoreCase);
        return Regex.Replace(withoutUrls, @"\s+", " ").Trim().Length >= 30;
    }
}
