using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using server.Services.Interfaces;

namespace server.Services;

public class DashboardService(
    AppDbContext context,
    ICurrentUserService currentUser) : IDashboardService
{
    public async Task<DashboardResponseDto> GetAsync(CancellationToken cancellationToken)
    {
        var userId = await currentUser.GetRequiredUserIdAsync(cancellationToken);
        var totalSkills = await context.UserSkills.CountAsync(
            skill => skill.UserId == userId,
            cancellationToken);
        var totalProjects = await context.Projects.CountAsync(
            project => project.UserId == userId,
            cancellationToken);
        var skillNames = await context.UserSkills
            .AsNoTracking()
            .Where(skill => skill.UserId == userId)
            .Select(skill => skill.Skill.Name)
            .ToListAsync(cancellationToken);
        var applications = await context.JobApplications
            .AsNoTracking()
            .Include(application => application.Requirements)
            .Where(application => application.UserId == userId)
            .OrderByDescending(application => application.UpdatedAt)
            .ToListAsync(cancellationToken);

        var applicationsByStatus = Enum
            .GetValues<JobApplicationStatus>()
            .ToDictionary(
                status => status.ToString(),
                status => applications.Count(application => application.Status == status));

        var analyses = applications
            .Where(application => application.Requirements.Count > 0)
            .Select(application => JobMatchCalculator.Calculate(
                application.Id,
                application.Requirements,
                skillNames))
            .ToList();

        var topMissingSkills = analyses
            .SelectMany(analysis => analysis.MissingRequiredSkills)
            .GroupBy(name => name, StringComparer.OrdinalIgnoreCase)
            .Select(group => new MissingSkillSummaryDto
            {
                Name = group.Key,
                Count = group.Count()
            })
            .OrderByDescending(item => item.Count)
            .ThenBy(item => item.Name)
            .Take(5)
            .ToList();

        return new DashboardResponseDto
        {
            TotalSkills = totalSkills,
            TotalProjects = totalProjects,
            TotalApplications = applications.Count,
            AverageMatchScore = analyses.Count == 0
                ? 0
                : Math.Round(analyses.Average(analysis => analysis.MatchScore), 2),
            ApplicationsByStatus = applicationsByStatus,
            TopMissingSkills = topMissingSkills,
            RecentApplications = applications
                .Take(5)
                .Select(JobApplicationService.Map)
                .ToList()
        };
    }
}
