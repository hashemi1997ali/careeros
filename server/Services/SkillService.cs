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
        var query = _context.UserSkills
            .AsNoTracking()
            .Include(userSkill => userSkill.Skill)
            .Include(userSkill => userSkill.ProjectSkills)
            .ThenInclude(projectSkill => projectSkill.Project)
            .Where(userSkill => userSkill.UserId == userId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(userSkill =>
                EF.Functions.ILike(userSkill.Skill.Name, pattern) ||
                EF.Functions.ILike(userSkill.Skill.Category, pattern));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            var categorySlug = SkillNameNormalizer.ToSlug(SkillNameNormalizer.CanonicalizeCategory(category));
            query = query.Where(userSkill => userSkill.Skill.CategorySlug == categorySlug);
        }

        if (level.HasValue)
        {
            query = query.Where(userSkill => userSkill.Level == level.Value);
        }

        return await query
            .OrderBy(userSkill => userSkill.Skill.Name)
            .ThenBy(userSkill => userSkill.Skill.Category)
            .Select(userSkill => new SkillResponseDto
            {
                Id = userSkill.Id,
                Name = userSkill.Skill.Name,
                Category = userSkill.Skill.Category,
                Level = userSkill.Level,
                StartDate = userSkill.StartDate,
                Projects = userSkill.ProjectSkills
                    .OrderBy(projectSkill => projectSkill.Project!.Title)
                    .Select(projectSkill => new SkillProjectDto
                    {
                        Id = projectSkill.ProjectId,
                        Title = projectSkill.Project!.Title
                    })
                    .ToList()
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SkillSuggestionDto>> GetSuggestionsAsync(
        string search,
        CancellationToken cancellationToken)
    {
        var canonical = SkillNameNormalizer.CanonicalizeName(search);
        var slug = SkillNameNormalizer.ToSlug(canonical);
        var pattern = $"%{search.Trim()}%";

        return await _context.Skills
            .AsNoTracking()
            .Where(skill => skill.Slug.Contains(slug) ||
                            EF.Functions.ILike(skill.Name, pattern) ||
                            EF.Functions.ILike(skill.Category, pattern))
            .OrderBy(skill => skill.Name)
            .ThenBy(skill => skill.Category)
            .Take(12)
            .Select(skill => new SkillSuggestionDto
            {
                Id = skill.Id,
                Name = skill.Name,
                Category = skill.Category
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<SkillResponseDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var userId = await _currentUser.GetRequiredUserIdAsync(cancellationToken);
        return await _context.UserSkills
            .AsNoTracking()
            .Where(userSkill => userSkill.Id == id && userSkill.UserId == userId)
            .Select(userSkill => new SkillResponseDto
            {
                Id = userSkill.Id,
                Name = userSkill.Skill.Name,
                Category = userSkill.Skill.Category,
                Level = userSkill.Level,
                StartDate = userSkill.StartDate,
                Projects = userSkill.ProjectSkills
                    .OrderBy(projectSkill => projectSkill.Project!.Title)
                    .Select(projectSkill => new SkillProjectDto
                    {
                        Id = projectSkill.ProjectId,
                        Title = projectSkill.Project!.Title
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<SkillResponseDto> CreateAsync(CreateSkillDto dto, CancellationToken cancellationToken)
    {
        var userId = await _currentUser.GetRequiredUserIdAsync(cancellationToken);
        ValidateStartDate(dto.StartDate);
        var skill = await FindOrCreateCatalogSkillAsync(dto.Name, dto.Category, cancellationToken);
        await EnsureUniqueAsync(userId, skill.Id, null, cancellationToken);

        var userSkill = new UserSkill
        {
            UserId = userId,
            Skill = skill,
            SkillId = skill.Id,
            Level = dto.Level!.Value,
            StartDate = dto.StartDate
        };
        _context.UserSkills.Add(userSkill);
        await _context.SaveChangesAsync(cancellationToken);

        return new SkillResponseDto
        {
            Id = userSkill.Id,
            Name = skill.Name,
            Category = skill.Category,
            Level = userSkill.Level,
            StartDate = userSkill.StartDate
        };
    }

    public async Task<bool> UpdateAsync(int id, UpdateSkillDto dto, CancellationToken cancellationToken)
    {
        var userId = await _currentUser.GetRequiredUserIdAsync(cancellationToken);
        var userSkill = await _context.UserSkills.FirstOrDefaultAsync(
            item => item.Id == id && item.UserId == userId,
            cancellationToken);
        if (userSkill is null)
        {
            return false;
        }

        ValidateStartDate(dto.StartDate);
        var skill = await FindOrCreateCatalogSkillAsync(dto.Name, dto.Category, cancellationToken);
        await EnsureUniqueAsync(userId, skill.Id, id, cancellationToken);

        userSkill.Skill = skill;
        userSkill.SkillId = skill.Id;
        userSkill.Level = dto.Level!.Value;
        userSkill.StartDate = dto.StartDate;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var userId = await _currentUser.GetRequiredUserIdAsync(cancellationToken);
        var userSkill = await _context.UserSkills.FirstOrDefaultAsync(
            item => item.Id == id && item.UserId == userId,
            cancellationToken);
        if (userSkill is null)
        {
            return false;
        }

        _context.UserSkills.Remove(userSkill);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<Skill> FindOrCreateCatalogSkillAsync(
        string rawName,
        string rawCategory,
        CancellationToken cancellationToken)
    {
        var name = SkillNameNormalizer.CanonicalizeName(rawName);
        var category = SkillNameNormalizer.CanonicalizeCategory(rawCategory);
        var slug = SkillNameNormalizer.ToSlug(name);
        var categorySlug = SkillNameNormalizer.ToSlug(category);
        var skill = await _context.Skills.FirstOrDefaultAsync(
            item => item.Slug == slug && item.CategorySlug == categorySlug,
            cancellationToken);
        if (skill is not null)
        {
            return skill;
        }

        await _context.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "Skills" ("Name", "Category", "Slug", "CategorySlug")
            VALUES ({name}, {category}, {slug}, {categorySlug})
            ON CONFLICT ("Slug", "CategorySlug") DO NOTHING;
            """, cancellationToken);

        return await _context.Skills.FirstAsync(
            item => item.Slug == slug && item.CategorySlug == categorySlug,
            cancellationToken);
    }

    private async Task EnsureUniqueAsync(
        Guid userId,
        int skillId,
        int? excludedId,
        CancellationToken cancellationToken)
    {
        var exists = await _context.UserSkills.AnyAsync(
            userSkill => userSkill.UserId == userId &&
                         userSkill.SkillId == skillId &&
                         (!excludedId.HasValue || userSkill.Id != excludedId.Value),
            cancellationToken);
        if (exists)
        {
            var skill = await _context.Skills.FindAsync([skillId], cancellationToken);
            throw new ConflictException(
                $"A skill named '{skill?.Name}' already exists in category '{skill?.Category}'.");
        }
    }

    private static void ValidateStartDate(DateOnly? startDate)
    {
        if (startDate.HasValue && startDate.Value > DateOnly.FromDateTime(DateTime.UtcNow))
        {
            throw new DomainValidationException("startDate", "Skill start date cannot be in the future.");
        }
    }
}
