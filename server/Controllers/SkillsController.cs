using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SkillsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SkillsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Skill>>> GetSkills()
    {
        var skills = await _context.Skills.ToListAsync();

        return Ok(skills);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Skill>> GetSkill(int id)
    {
        var skill = await _context.Skills.FindAsync(id);

        if (skill == null)
        {
            return NotFound();
        }

        return Ok(skill);
    }

    [HttpPost]
    public async Task<ActionResult<Skill>> CreateSkill(Skill skill)
    {
        _context.Skills.Add(skill);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetSkill),
            new { id = skill.Id },
            skill
        );
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSkill(int id, Skill updatedSkill)
    {
        var skill = await _context.Skills.FindAsync(id);

        if (skill == null)
        {
            return NotFound();
        }

        skill.Name = updatedSkill.Name;
        skill.Category = updatedSkill.Category;
        skill.Level = updatedSkill.Level;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSkill(int id)
    {
        var skill = await _context.Skills.FindAsync(id);

        if (skill == null)
        {
            return NotFound();
        }

        _context.Skills.Remove(skill);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}