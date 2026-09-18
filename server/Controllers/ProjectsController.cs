using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services.Interfaces;

namespace server.Controllers;

[ApiController]
[Authorize]
[Route("api/projects")]
public class ProjectsController(IProjectService projectService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<ProjectResponseDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ProjectResponseDto>>> GetProjects(
        [FromQuery] string? search,
        [FromQuery] int? skillId,
        CancellationToken cancellationToken)
    {
        return Ok(await projectService.GetAllAsync(search, skillId, cancellationToken));
    }

    [HttpGet("{id:int:min(1)}")]
    [ProducesResponseType<ProjectResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectResponseDto>> GetProject(
        int id,
        CancellationToken cancellationToken)
    {
        var project = await projectService.GetByIdAsync(id, cancellationToken);
        return project is null ? NotFound() : Ok(project);
    }

    [HttpPost]
    [ProducesResponseType<ProjectResponseDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProjectResponseDto>> CreateProject(
        CreateProjectDto dto,
        CancellationToken cancellationToken)
    {
        var project = await projectService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
    }

    [HttpPut("{id:int:min(1)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProject(
        int id,
        UpdateProjectDto dto,
        CancellationToken cancellationToken)
    {
        return await projectService.UpdateAsync(id, dto, cancellationToken)
            ? NoContent()
            : NotFound();
    }

    [HttpDelete("{id:int:min(1)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProject(
        int id,
        CancellationToken cancellationToken)
    {
        return await projectService.DeleteAsync(id, cancellationToken)
            ? NoContent()
            : NotFound();
    }

    [HttpPost("{projectId:int:min(1)}/skills/{skillId:int:min(1)}")]
    [ProducesResponseType<ProjectResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProjectResponseDto>> AddSkill(
        int projectId,
        int skillId,
        CancellationToken cancellationToken)
    {
        return Ok(await projectService.AddSkillAsync(projectId, skillId, cancellationToken));
    }

    [HttpDelete("{projectId:int:min(1)}/skills/{skillId:int:min(1)}")]
    [ProducesResponseType<ProjectResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectResponseDto>> RemoveSkill(
        int projectId,
        int skillId,
        CancellationToken cancellationToken)
    {
        return Ok(await projectService.RemoveSkillAsync(projectId, skillId, cancellationToken));
    }
}
