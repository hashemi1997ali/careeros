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
            .ThenInclude(projectSkill => projectSkill.UserSkill)
            .ThenInclude(userSkill => userSkill.Skill)
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
                project.ProjectSkills.Any(projectSkill => projectSkill.UserSkillId == skillId.Value));
        }

        var projects = await query
            .OrderByDescending(project => project.UpdatedAt)
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
            .ThenInclude(projectSkill => projectSkill.UserSkill)
            .ThenInclude(userSkill => userSkill.Skill)
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
        ValidateDateRange(dto.StartDate, dto.EndDate);
        var skillIds = await GetValidSkillIdsAsync(userId, dto.SkillIds, cancellationToken);
        var now = DateTime.UtcNow;

        var project = new Project
        {
            UserId = userId,
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            RepositoryUrl = NormalizeOptional(dto.RepositoryUrl),
            LiveUrl = NormalizeOptional(dto.LiveUrl),
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            CreatedAt = now,
            UpdatedAt = now,
            ProjectSkills = skillIds
                .Select(skillId => new ProjectSkill { UserSkillId = skillId })
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
        ValidateDateRange(dto.StartDate, dto.EndDate);
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
        project.StartDate = dto.StartDate;
        project.EndDate = dto.EndDate;
        project.UpdatedAt = DateTime.UtcNow;

        project.ProjectSkills.Clear();
        foreach (var skillId in skillIds)
        {
            project.ProjectSkills.Add(new ProjectSkill
            {
                ProjectId = project.Id,
                UserSkillId = skillId
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

        if (!await context.UserSkills.AnyAsync(
                skill => skill.Id == skillId && skill.UserId == userId,
                cancellationToken))
        {
            throw new ResourceNotFoundException("Skill", skillId);
        }

        var exists = await context.ProjectSkills.AnyAsync(
            projectSkill => projectSkill.ProjectId == projectId && projectSkill.UserSkillId == skillId,
            cancellationToken);

        if (exists)
        {
            throw new ConflictException("The skill is already linked to this project.");
        }

        context.ProjectSkills.Add(new ProjectSkill
        {
            ProjectId = projectId,
            UserSkillId = skillId
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
            .Include(projectSkill => projectSkill.UserSkill)
            .FirstOrDefaultAsync(
                projectSkill =>
                    projectSkill.ProjectId == projectId &&
                    projectSkill.UserSkillId == skillId &&
                    projectSkill.UserSkill.UserId == userId,
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

        var existingIds = await context.UserSkills
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
            project.UpdatedAt = DateTime.UtcNow;
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
        StartDate = project.StartDate,
        EndDate = project.EndDate,
        Skills = project.ProjectSkills
            .Select(projectSkill => projectSkill.UserSkill)
            .OrderBy(userSkill => userSkill.Skill.Name)
            .Select(skill => new SkillResponseDto
            {
                Id = skill.Id,
                Name = skill.Skill.Name,
                Category = skill.Skill.Category,
                Level = skill.Level,
                StartDate = skill.StartDate
            })
            .ToList()
    };

    private static void ValidateDateRange(DateOnly? startDate, DateOnly? endDate)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (endDate.HasValue && !startDate.HasValue)
        {
            throw new DomainValidationException("endDate", "A project end date requires a start date.");
        }

        if ((startDate.HasValue && startDate.Value > today) ||
            (endDate.HasValue && endDate.Value > today))
        {
            throw new DomainValidationException("dateRange", "Project dates cannot be in the future.");
        }

        if (startDate.HasValue && endDate.HasValue && endDate.Value < startDate.Value)
        {
            throw new DomainValidationException(
                "dateRange",
                "The project end date cannot be earlier than its start date.");
        }
    }
}
