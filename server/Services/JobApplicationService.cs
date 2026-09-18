using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Exceptions;
using server.Models;
using server.Services.Interfaces;

namespace server.Services;

public class JobApplicationService(
    AppDbContext context,
    ICurrentUserService currentUser) : IJobApplicationService
{
    public async Task<IReadOnlyList<JobApplicationResponseDto>> GetAllAsync(
        JobApplicationStatus? status,
        string? search,
        CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);
        var query = context.JobApplications
            .AsNoTracking()
            .Include(application => application.Requirements)
            .Where(application => application.UserId == userId)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(application => application.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(application =>
                EF.Functions.ILike(application.Company, pattern) ||
                EF.Functions.ILike(application.Position, pattern) ||
                (application.Location != null && EF.Functions.ILike(application.Location, pattern)));
        }

        var applications = await query
            .OrderByDescending(application => application.UpdatedAtUtc)
            .ToListAsync(cancellationToken);

        return applications.Select(Map).ToList();
    }

    public async Task<JobApplicationResponseDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);
        var application = await context.JobApplications
            .AsNoTracking()
            .Include(item => item.Requirements)
            .FirstOrDefaultAsync(
                item => item.Id == id && item.UserId == userId,
                cancellationToken);

        return application is null ? null : Map(application);
    }

    public async Task<JobApplicationResponseDto> CreateAsync(
        CreateJobApplicationDto dto,
        CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);
        ValidateTimeline(dto.AppliedAtUtc, dto.InterviewAtUtc);
        var now = DateTime.UtcNow;

        var application = new JobApplication
        {
            UserId = userId,
            Company = dto.Company.Trim(),
            Position = dto.Position.Trim(),
            JobUrl = NormalizeOptional(dto.JobUrl),
            Location = NormalizeOptional(dto.Location),
            Salary = dto.Salary,
            Status = dto.Status,
            AppliedAtUtc = dto.AppliedAtUtc,
            InterviewAtUtc = dto.InterviewAtUtc,
            Notes = NormalizeOptional(dto.Notes),
            JobDescription = NormalizeOptional(dto.JobDescription),
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            Requirements = MapRequirements(dto.Requirements)
        };

        ApplyStatusDates(application, now);

        context.JobApplications.Add(application);
        await context.SaveChangesAsync(cancellationToken);

        return Map(application);
    }

    public async Task<bool> UpdateAsync(
        int id,
        UpdateJobApplicationDto dto,
        CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);
        ValidateTimeline(dto.AppliedAtUtc, dto.InterviewAtUtc);

        var application = await context.JobApplications
            .Include(item => item.Requirements)
            .FirstOrDefaultAsync(
                item => item.Id == id && item.UserId == userId,
                cancellationToken);

        if (application is null)
        {
            return false;
        }

        application.Company = dto.Company.Trim();
        application.Position = dto.Position.Trim();
        application.JobUrl = NormalizeOptional(dto.JobUrl);
        application.Location = NormalizeOptional(dto.Location);
        application.Salary = dto.Salary;
        application.Status = dto.Status!.Value;
        application.AppliedAtUtc = dto.AppliedAtUtc;
        application.InterviewAtUtc = dto.InterviewAtUtc;
        application.Notes = NormalizeOptional(dto.Notes);
        application.JobDescription = NormalizeOptional(dto.JobDescription);
        application.UpdatedAtUtc = DateTime.UtcNow;

        application.Requirements.Clear();
        foreach (var requirement in MapRequirements(dto.Requirements))
        {
            application.Requirements.Add(requirement);
        }

        ApplyStatusDates(application, application.UpdatedAtUtc);
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UpdateStatusAsync(
        int id,
        UpdateJobApplicationStatusDto dto,
        CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);
        var application = await context.JobApplications.FirstOrDefaultAsync(
            item => item.Id == id && item.UserId == userId,
            cancellationToken);

        if (application is null)
        {
            return false;
        }

        application.Status = dto.Status!.Value;
        application.UpdatedAtUtc = DateTime.UtcNow;
        ApplyStatusDates(application, application.UpdatedAtUtc);

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);
        var application = await context.JobApplications.FirstOrDefaultAsync(
            item => item.Id == id && item.UserId == userId,
            cancellationToken);

        if (application is null)
        {
            return false;
        }

        context.JobApplications.Remove(application);
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<JobMatchResponseDto> AnalyzeMatchAsync(
        int id,
        CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);
        var application = await context.JobApplications
            .AsNoTracking()
            .Include(item => item.Requirements)
            .FirstOrDefaultAsync(
                item => item.Id == id && item.UserId == userId,
                cancellationToken);

        if (application is null)
        {
            throw new ResourceNotFoundException("Job application", id);
        }

        var skillNames = await context.Skills
            .AsNoTracking()
            .Where(skill => skill.UserId == userId)
            .Select(skill => skill.Name)
            .ToListAsync(cancellationToken);

        return JobMatchCalculator.Calculate(id, application.Requirements, skillNames);
    }

    private static List<JobRequirement> MapRequirements(
        IEnumerable<JobRequirementDto> requirementDtos)
    {
        var items = requirementDtos.ToList();
        var duplicateNames = items
            .GroupBy(item => item.Name.Trim(), StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .Order()
            .ToList();

        if (duplicateNames.Count > 0)
        {
            throw new DomainValidationException(
                "requirements",
                $"Duplicate requirements: {string.Join(", ", duplicateNames)}.");
        }

        return items
            .Select(item => new JobRequirement
            {
                Name = item.Name.Trim(),
                IsRequired = item.IsRequired,
                Weight = item.Weight
            })
            .ToList();
    }

    private static void ValidateTimeline(DateTime? appliedAtUtc, DateTime? interviewAtUtc)
    {
        if (appliedAtUtc.HasValue && interviewAtUtc.HasValue && interviewAtUtc < appliedAtUtc)
        {
            throw new DomainValidationException(
                "interviewAtUtc",
                "Interview date cannot be earlier than the application date.");
        }
    }

    private static void ApplyStatusDates(JobApplication application, DateTime now)
    {
        if (application.Status != JobApplicationStatus.Saved)
        {
            application.AppliedAtUtc ??= now;
        }

        if (application.Status is
            JobApplicationStatus.HrInterview or
            JobApplicationStatus.TechnicalInterview)
        {
            application.InterviewAtUtc ??= now;
        }
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    internal static JobApplicationResponseDto Map(JobApplication application) => new()
    {
        Id = application.Id,
        Company = application.Company,
        Position = application.Position,
        JobUrl = application.JobUrl,
        Location = application.Location,
        Salary = application.Salary,
        Status = application.Status,
        AppliedAtUtc = application.AppliedAtUtc,
        InterviewAtUtc = application.InterviewAtUtc,
        Notes = application.Notes,
        JobDescription = application.JobDescription,
        CreatedAtUtc = application.CreatedAtUtc,
        UpdatedAtUtc = application.UpdatedAtUtc,
        Requirements = application.Requirements
            .OrderByDescending(requirement => requirement.IsRequired)
            .ThenByDescending(requirement => requirement.Weight)
            .ThenBy(requirement => requirement.Name)
            .Select(requirement => new JobRequirementResponseDto
            {
                Id = requirement.Id,
                Name = requirement.Name,
                IsRequired = requirement.IsRequired,
                Weight = requirement.Weight
            })
            .ToList()
    };
}
