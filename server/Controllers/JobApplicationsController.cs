using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Models;
using server.Services.Interfaces;

namespace server.Controllers;

[ApiController]
[Authorize]
[Route("api/job-applications")]
public class JobApplicationsController(IJobApplicationService jobApplicationService)
    : ControllerBase
{
    /// <summary>
    /// Lists the user's applications. With <c>page</c> the result is a page plus status counts;
    /// <c>status</c> may repeat (e.g. both interview stages) and <c>sort</c> is one of
    /// updated, company, role, status, applied, interview or salary.
    /// </summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<JobApplicationResponseDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<PagedResponseDto<JobApplicationResponseDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetApplications(
        [FromQuery] JobApplicationStatus[]? status,
        [FromQuery] string? search,
        [FromQuery] PageQueryDto paging,
        CancellationToken cancellationToken)
    {
        if (paging.Page is { } page)
        {
            return Ok(await jobApplicationService.GetPageAsync(status ?? [], search, paging.Sort, page, paging.PageSize, cancellationToken));
        }

        // The full list keeps its single-status filter for existing callers.
        return Ok(await jobApplicationService.GetAllAsync(status is [var single] ? single : null, search, cancellationToken));
    }

    [HttpGet("{id:int:min(1)}")]
    [ProducesResponseType<JobApplicationResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<JobApplicationResponseDto>> GetApplication(
        int id,
        CancellationToken cancellationToken)
    {
        var application = await jobApplicationService.GetByIdAsync(id, cancellationToken);
        return application is null ? NotFound() : Ok(application);
    }

    [HttpPost]
    [ProducesResponseType<JobApplicationResponseDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<JobApplicationResponseDto>> CreateApplication(
        CreateJobApplicationDto dto,
        CancellationToken cancellationToken)
    {
        var application = await jobApplicationService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetApplication), new { id = application.Id }, application);
    }

    [HttpPut("{id:int:min(1)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateApplication(
        int id,
        UpdateJobApplicationDto dto,
        CancellationToken cancellationToken)
    {
        return await jobApplicationService.UpdateAsync(id, dto, cancellationToken)
            ? NoContent()
            : NotFound();
    }

    [HttpPatch("{id:int:min(1)}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(
        int id,
        UpdateJobApplicationStatusDto dto,
        CancellationToken cancellationToken)
    {
        return await jobApplicationService.UpdateStatusAsync(id, dto, cancellationToken)
            ? NoContent()
            : NotFound();
    }

    [HttpGet("{id:int:min(1)}/match")]
    [ProducesResponseType<JobMatchResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<JobMatchResponseDto>> GetMatch(
        int id,
        CancellationToken cancellationToken)
    {
        return Ok(await jobApplicationService.AnalyzeMatchAsync(id, cancellationToken));
    }

    [HttpDelete("{id:int:min(1)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteApplication(
        int id,
        CancellationToken cancellationToken)
    {
        return await jobApplicationService.DeleteAsync(id, cancellationToken)
            ? NoContent()
            : NotFound();
    }
}
