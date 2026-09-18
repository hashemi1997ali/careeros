using server.DTOs;

namespace server.Services.Interfaces;

public interface IProjectService
{
    Task<IReadOnlyList<ProjectResponseDto>> GetAllAsync(
        string? search,
        int? skillId,
        CancellationToken cancellationToken);

    Task<ProjectResponseDto?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<ProjectResponseDto> CreateAsync(
        CreateProjectDto dto,
        CancellationToken cancellationToken);

    Task<bool> UpdateAsync(
        int id,
        UpdateProjectDto dto,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);

    Task<ProjectResponseDto> AddSkillAsync(
        int projectId,
        int skillId,
        CancellationToken cancellationToken);

    Task<ProjectResponseDto> RemoveSkillAsync(
        int projectId,
        int skillId,
        CancellationToken cancellationToken);
}
