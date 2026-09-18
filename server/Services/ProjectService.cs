using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Exceptions;
using server.Models;
using server.Services.Interfaces;

namespace server.Services;

public class ProjectService(
    AppDbContext context,
    ICurrentUserService currentUser) : IProjectService
{
    public async Task<IReadOnlyList<ProjectResponseDto>> GetAllAsync(
        string? search,
        int? skillId,
        CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);
        var query = context.Projects
            .AsNoTracking()
            .Include(project => project.ProjectSkills)
            .ThenInclude(projectSkill => projectSkill.Skill)
            .Where(project => project.UserId == userId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(project =>
                EF.Functions.ILike(project.Title, pattern) ||
                EF.Functions.ILike(project.Description, pattern));
        }

        if (skillId.HasValue)
        {
            query = query.Where(project =>
                project.ProjectSkills.Any(projectSkill => projectSkill.SkillId == skillId.Value));
        }

        var projects = await query
            .OrderByDescending(project => project.UpdatedAtUtc)
            .ToListAsync(cancellationToken);

        return projects.Select(Map).ToList();
    }

    public async Task<ProjectResponseDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);
        var project = await context.Projects
            .AsNoTracking()
            .Include(item => item.ProjectSkills)
            .ThenInclude(projectSkill => projectSkill.Skill)
            .FirstOrDefaultAsync(
                item => item.Id == id && item.UserId == userId,
                cancellationToken);

        return project is null ? null : Map(project);
    }

    public async Task<ProjectResponseDto> CreateAsync(
        CreateProjectDto dto,
        CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);
        var skillIds = await GetValidSkillIdsAsync(userId, dto.SkillIds, cancellationToken);
        var now = DateTime.UtcNow;

        var project = new Project
        {
            UserId = userId,
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            RepositoryUrl = NormalizeOptional(dto.RepositoryUrl),
            LiveUrl = NormalizeOptional(dto.LiveUrl),
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            ProjectSkills = skillIds
                .Select(skillId => new ProjectSkill { SkillId = skillId })
                .ToList()
        };

        context.Projects.Add(project);
        await context.SaveChangesAsync(cancellationToken);

        return (await GetByIdAsync(project.Id, cancellationToken))!;
    }

    public async Task<bool> UpdateAsync(
        int id,
        UpdateProjectDto dto,
        CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);
        var project = await context.Projects
            .Include(item => item.ProjectSkills)
            .FirstOrDefaultAsync(
                item => item.Id == id && item.UserId == userId,
                cancellationToken);

        if (project is null)
        {
            return false;
        }

        var skillIds = await GetValidSkillIdsAsync(userId, dto.SkillIds, cancellationToken);

        project.Title = dto.Title.Trim();
        project.Description = dto.Description.Trim();
        project.RepositoryUrl = NormalizeOptional(dto.RepositoryUrl);
        project.LiveUrl = NormalizeOptional(dto.LiveUrl);
        project.UpdatedAtUtc = DateTime.UtcNow;

        project.ProjectSkills.Clear();
        foreach (var skillId in skillIds)
        {
            project.ProjectSkills.Add(new ProjectSkill
            {
                ProjectId = project.Id,
                SkillId = skillId
            });
        }

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);
        var project = await context.Projects.FirstOrDefaultAsync(
            item => item.Id == id && item.UserId == userId,
            cancellationToken);

        if (project is null)
        {
            return false;
        }

        context.Projects.Remove(project);
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<ProjectResponseDto> AddSkillAsync(
        int projectId,
        int skillId,
        CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);

        if (!await context.Projects.AnyAsync(
                project => project.Id == projectId && project.UserId == userId,
                cancellationToken))
        {
            throw new ResourceNotFoundException("Project", projectId);
        }

        if (!await context.Skills.AnyAsync(
                skill => skill.Id == skillId && skill.UserId == userId,
                cancellationToken))
        {
            throw new ResourceNotFoundException("Skill", skillId);
        }

        var exists = await context.ProjectSkills.AnyAsync(
            projectSkill => projectSkill.ProjectId == projectId && projectSkill.SkillId == skillId,
            cancellationToken);

        if (exists)
        {
            throw new ConflictException("The skill is already linked to this project.");
        }

        context.ProjectSkills.Add(new ProjectSkill
        {
            ProjectId = projectId,
            SkillId = skillId
        });

        await TouchProjectAsync(projectId, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return (await GetByIdAsync(projectId, cancellationToken))!;
    }

    public async Task<ProjectResponseDto> RemoveSkillAsync(
        int projectId,
        int skillId,
        CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);

        if (!await context.Projects.AnyAsync(
                project => project.Id == projectId && project.UserId == userId,
                cancellationToken))
        {
            throw new ResourceNotFoundException("Project", projectId);
        }

        var link = await context.ProjectSkills
            .Include(projectSkill => projectSkill.Skill)
            .FirstOrDefaultAsync(
                projectSkill =>
                    projectSkill.ProjectId == projectId &&
                    projectSkill.SkillId == skillId &&
                    projectSkill.Skill.UserId == userId,
                cancellationToken);

        if (link is null)
        {
            throw new ResourceNotFoundException("Project skill link", $"{projectId}/{skillId}");
        }

        context.ProjectSkills.Remove(link);
        await TouchProjectAsync(projectId, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return (await GetByIdAsync(projectId, cancellationToken))!;
    }

    private async Task<IReadOnlyList<int>> GetValidSkillIdsAsync(
        Guid userId,
        IEnumerable<int> requestedIds,
        CancellationToken cancellationToken)
    {
        var skillIds = requestedIds.Distinct().ToList();

        if (skillIds.Any(id => id <= 0))
        {
            throw new DomainValidationException("skillIds", "Skill ids must be positive integers.");
        }

        var existingIds = await context.Skills
            .Where(skill => skill.UserId == userId && skillIds.Contains(skill.Id))
            .Select(skill => skill.Id)
            .ToListAsync(cancellationToken);

        var missingIds = skillIds.Except(existingIds).Order().ToList();
        if (missingIds.Count > 0)
        {
            throw new DomainValidationException(
                "skillIds",
                $"Unknown skill ids: {string.Join(", ", missingIds)}.");
        }

        return skillIds;
    }

    private async Task TouchProjectAsync(int projectId, CancellationToken cancellationToken)
    {
        var project = await context.Projects.FindAsync([projectId], cancellationToken);
        if (project is not null)
        {
            project.UpdatedAtUtc = DateTime.UtcNow;
        }
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static ProjectResponseDto Map(Project project) => new()
    {
        Id = project.Id,
        Title = project.Title,
        Description = project.Description,
        RepositoryUrl = project.RepositoryUrl,
        LiveUrl = project.LiveUrl,
        CreatedAtUtc = project.CreatedAtUtc,
        UpdatedAtUtc = project.UpdatedAtUtc,
        Skills = project.ProjectSkills
            .Select(projectSkill => projectSkill.Skill)
            .OrderBy(skill => skill.Name)
            .Select(skill => new SkillResponseDto
            {
                Id = skill.Id,
                Name = skill.Name,
                Category = skill.Category,
                Level = skill.Level
            })
            .ToList()
    };
}
