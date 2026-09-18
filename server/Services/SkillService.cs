using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Exceptions;
using server.Models;
using server.Services.Interfaces;

namespace server.Services;

public class SkillService : ISkillService
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public SkillService(AppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<SkillResponseDto>> GetAllAsync(
        string? search,
        string? category,
        SkillLevel? level,
        CancellationToken cancellationToken)
    {
        var userId = await _currentUser.GetRequiredUserIdAsync(cancellationToken);
        var query = _context.Skills
            .AsNoTracking()
            .Where(skill => skill.UserId == userId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(skill =>
                EF.Functions.ILike(skill.Name, pattern) ||
                EF.Functions.ILike(skill.Category, pattern));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            var normalizedCategory = category.Trim().ToLower();
            query = query.Where(skill => skill.Category.ToLower() == normalizedCategory);
        }

        if (level.HasValue)
        {
            query = query.Where(skill => skill.Level == level.Value);
        }

        return await query
            .OrderBy(skill => skill.Name)
            .Select(skill => new SkillResponseDto
            {
                Id = skill.Id,
                Name = skill.Name,
                Category = skill.Category,
                Level = skill.Level
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<SkillResponseDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var userId = await _currentUser.GetRequiredUserIdAsync(cancellationToken);

        return await _context.Skills
            .AsNoTracking()
            .Where(skill => skill.Id == id && skill.UserId == userId)
            .Select(skill => new SkillResponseDto
            {
                Id = skill.Id,
                Name = skill.Name,
                Category = skill.Category,
                Level = skill.Level
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<SkillResponseDto> CreateAsync(
        CreateSkillDto dto,
        CancellationToken cancellationToken)
    {
        var userId = await _currentUser.GetRequiredUserIdAsync(cancellationToken);
        var name = dto.Name.Trim();
        var category = dto.Category.Trim();

        await EnsureUniqueAsync(userId, name, category, null, cancellationToken);

        var skill = new Skill
        {
            UserId = userId,
            Name = name,
            Category = category,
            Level = dto.Level!.Value
        };

        _context.Skills.Add(skill);

        await _context.SaveChangesAsync(cancellationToken);

        return new SkillResponseDto
        {
            Id = skill.Id,
            Name = skill.Name,
            Category = skill.Category,
            Level = skill.Level
        };
    }

    public async Task<bool> UpdateAsync(
        int id,
        UpdateSkillDto dto,
        CancellationToken cancellationToken)
    {
        var userId = await _currentUser.GetRequiredUserIdAsync(cancellationToken);
        var skill = await _context.Skills.FirstOrDefaultAsync(
            item => item.Id == id && item.UserId == userId,
            cancellationToken);

        if (skill == null)
        {
            return false;
        }

        var name = dto.Name.Trim();
        var category = dto.Category.Trim();

        await EnsureUniqueAsync(userId, name, category, id, cancellationToken);

        skill.Name = name;
        skill.Category = category;
        skill.Level = dto.Level!.Value;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var userId = await _currentUser.GetRequiredUserIdAsync(cancellationToken);
        var skill = await _context.Skills.FirstOrDefaultAsync(
            item => item.Id == id && item.UserId == userId,
            cancellationToken);

        if (skill == null)
        {
            return false;
        }

        _context.Skills.Remove(skill);

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    private async Task EnsureUniqueAsync(
        Guid userId,
        string name,
        string category,
        int? excludedId,
        CancellationToken cancellationToken)
    {
        var normalizedName = name.ToLower();
        var normalizedCategory = category.ToLower();

        var exists = await _context.Skills.AnyAsync(
            skill =>
                skill.UserId == userId &&
                (!excludedId.HasValue || skill.Id != excludedId.Value) &&
                skill.Name.ToLower() == normalizedName &&
                skill.Category.ToLower() == normalizedCategory,
            cancellationToken);

        if (exists)
        {
            throw new ConflictException(
                $"A skill named '{name}' already exists in category '{category}'.");
        }
    }
}
