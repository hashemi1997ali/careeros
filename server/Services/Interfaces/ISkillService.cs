using server.DTOs;

namespace server.Services.Interfaces;

public interface ISkillService
{
    Task<IEnumerable<SkillResponseDto>> GetAllAsync();

    Task<SkillResponseDto?> GetByIdAsync(int id);

    Task<SkillResponseDto> CreateAsync(CreateSkillDto dto);

    Task<bool> UpdateAsync(int id, UpdateSkillDto dto);

    Task<bool> DeleteAsync(int id);
}