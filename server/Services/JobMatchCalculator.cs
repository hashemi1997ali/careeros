using server.DTOs;
using server.Models;

namespace server.Services;

internal static class JobMatchCalculator
{
    public static JobMatchResponseDto Calculate(
        int jobApplicationId,
        IEnumerable<JobRequirement> requirements,
        IEnumerable<string> skillNames)
    {
        var requirementList = requirements.ToList();
        var normalizedSkills = skillNames
            .Select(Normalize)
            .ToHashSet(StringComparer.Ordinal);

        var matched = requirementList
            .Where(requirement => normalizedSkills.Contains(Normalize(requirement.Name)))
            .ToList();

        var score = requirementList.Count == 0
            ? 0
            : Math.Round((decimal)matched.Count / requirementList.Count * 100, 2);

        return new JobMatchResponseDto
        {
            JobApplicationId = jobApplicationId,
            MatchScore = score,
            HasRequirements = requirementList.Count > 0,
            MatchedSkills = matched
                .Select(requirement => requirement.Name)
                .Order()
                .ToList(),
            MissingRequiredSkills = requirementList
                .Where(requirement =>
                    requirement.IsRequired &&
                    !normalizedSkills.Contains(Normalize(requirement.Name)))
                .Select(requirement => requirement.Name)
                .Order()
                .ToList(),
            MissingOptionalSkills = requirementList
                .Where(requirement =>
                    !requirement.IsRequired &&
                    !normalizedSkills.Contains(Normalize(requirement.Name)))
                .Select(requirement => requirement.Name)
                .Order()
                .ToList()
        };
    }

    private static string Normalize(string value) => value.Trim().ToUpperInvariant();
}
