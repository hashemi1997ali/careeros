using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services.Interfaces;
using server.Models;

namespace server.Controllers;

[ApiController]
[Authorize]
[Route("api/skills")]
public class SkillsController : ControllerBase
{
    private readonly ISkillService _skillService;

    public SkillsController(ISkillService skillService)
    {
        _skillService = skillService;
    }

    [HttpGet("suggestions")]
    [ProducesResponseType<IReadOnlyList<SkillSuggestionDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<SkillSuggestionDto>>> GetSuggestions(
        [FromQuery] string search,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(search) || search.Trim().Length < 2)
        {
            return Ok(Array.Empty<SkillSuggestionDto>());
        }

        return Ok(await _skillService.GetSuggestionsAsync(search, cancellationToken));
    }

    [HttpGet]
    [ProducesResponseType<IReadOnlyList<SkillResponseDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<SkillResponseDto>>> GetSkills(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] SkillLevel? level,
        CancellationToken cancellationToken)
    {
        var skills = await _skillService.GetAllAsync(
            search,
            category,
            level,
            cancellationToken);

        return Ok(skills);
    }

    [HttpGet("{id:int:min(1)}")]
    [ProducesResponseType<SkillResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SkillResponseDto>> GetSkill(
        int id,
        CancellationToken cancellationToken)
    {
        var skill = await _skillService.GetByIdAsync(id, cancellationToken);

        if (skill == null)
        {
            return NotFound();
        }

        return Ok(skill);
    }

    [HttpPost]
    [ProducesResponseType<SkillResponseDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SkillResponseDto>> CreateSkill(
        CreateSkillDto dto,
        CancellationToken cancellationToken)
    {
        var createdSkill = await _skillService.CreateAsync(dto, cancellationToken);

        return CreatedAtAction(
            nameof(GetSkill),
            new { id = createdSkill.Id },
            createdSkill
        );
    }

    [HttpPut("{id:int:min(1)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateSkill(
        int id,
        UpdateSkillDto dto,
        CancellationToken cancellationToken)
    {
        var updated = await _skillService.UpdateAsync(id, dto, cancellationToken);

        if (!updated)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpDelete("{id:int:min(1)}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSkill(
        int id,
        CancellationToken cancellationToken)
    {
        var deleted = await _skillService.DeleteAsync(id, cancellationToken);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
