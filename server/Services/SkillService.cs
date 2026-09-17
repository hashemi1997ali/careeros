using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using server.Services.Interfaces;

namespace server.Services;

public class SkillService : ISkillService
{
    private readonly AppDbContext _context;

    public SkillService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SkillResponseDto>> GetAllAsync()
    {
        return await _context.Skills
            .Select(skill => new SkillResponseDto
            {
                Id = skill.Id,
                Name = skill.Name,
                Category = skill.Category,
                Level = skill.Level
            })
            .ToListAsync();
    }

    public async Task<SkillResponseDto?> GetByIdAsync(int id)
    {
        return await _context.Skills
            .Where(skill => skill.Id == id)
            .Select(skill => new SkillResponseDto
            {
                Id = skill.Id,
                Name = skill.Name,
                Category = skill.Category,
                Level = skill.Level
            })
            .FirstOrDefaultAsync();
    }

    public async Task<SkillResponseDto> CreateAsync(CreateSkillDto dto)
    {
        var skill = new Skill
        {
            Name = dto.Name,
            Category = dto.Category,
            Level = dto.Level
        };

        _context.Skills.Add(skill);

        await _context.SaveChangesAsync();

        return new SkillResponseDto
        {
            Id = skill.Id,
            Name = skill.Name,
            Category = skill.Category,
            Level = skill.Level
        };
    }

    public async Task<bool> UpdateAsync(int id, UpdateSkillDto dto)
    {
        var skill = await _context.Skills.FindAsync(id);

        if (skill == null)
        {
            return false;
        }

        skill.Name = dto.Name;
        skill.Category = dto.Category;
        skill.Level = dto.Level;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var skill = await _context.Skills.FindAsync(id);

        if (skill == null)
        {
            return false;
        }

        _context.Skills.Remove(skill);

        await _context.SaveChangesAsync();

        return true;
    }
}