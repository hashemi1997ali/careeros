using server.DTOs;
using server.Models;

namespace server.Services.Interfaces;

public interface ISkillService
{
    Task<IReadOnlyList<SkillResponseDto>> GetAllAsync(
        string? search,
        string? category,
        SkillLevel? level,
        CancellationToken cancellationToken);

    Task<SkillResponseDto?> GetByIdAsync(int id, CancellationToken cancellationToken);

    Task<SkillResponseDto> CreateAsync(CreateSkillDto dto, CancellationToken cancellationToken);

    Task<bool> UpdateAsync(int id, UpdateSkillDto dto, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}
