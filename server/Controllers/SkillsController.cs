using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services.Interfaces;

namespace server.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class SkillsController : ControllerBase
{
    private readonly ISkillService _skillService;

    public SkillsController(ISkillService skillService)
    {
        _skillService = skillService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SkillResponseDto>>> GetSkills()
    {
        var skills = await _skillService.GetAllAsync();

        return Ok(skills);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SkillResponseDto>> GetSkill(int id)
    {
        var skill = await _skillService.GetByIdAsync(id);

        if (skill == null)
        {
            return NotFound();
        }

        return Ok(skill);
    }

    [HttpPost]
    public async Task<ActionResult<SkillResponseDto>> CreateSkill(CreateSkillDto dto)
    {
        var createdSkill = await _skillService.CreateAsync(dto);

        return CreatedAtAction(
            nameof(GetSkill),
            new { id = createdSkill.Id },
            createdSkill
        );
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSkill(int id, UpdateSkillDto dto)
    {
        var updated = await _skillService.UpdateAsync(id, dto);

        if (!updated)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSkill(int id)
    {
        var deleted = await _skillService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}