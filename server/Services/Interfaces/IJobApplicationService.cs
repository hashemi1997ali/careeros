using server.DTOs;
using server.Models;

namespace server.Services.Interfaces;

public interface IJobApplicationService
{
    Task<IReadOnlyList<JobApplicationResponseDto>> GetAllAsync(
        JobApplicationStatus? status,
        string? search,
        CancellationToken cancellationToken);

    Task<JobApplicationResponseDto?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken);

    Task<JobApplicationResponseDto> CreateAsync(
        CreateJobApplicationDto dto,
        CancellationToken cancellationToken);

    Task<bool> UpdateAsync(
        int id,
        UpdateJobApplicationDto dto,
        CancellationToken cancellationToken);

    Task<bool> UpdateStatusAsync(
        int id,
        UpdateJobApplicationStatusDto dto,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);

    Task<JobMatchResponseDto> AnalyzeMatchAsync(
        int id,
        CancellationToken cancellationToken);
}
