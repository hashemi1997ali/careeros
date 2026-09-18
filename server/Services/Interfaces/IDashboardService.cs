using server.DTOs;

namespace server.Services.Interfaces;

public interface IDashboardService
{
    Task<DashboardResponseDto> GetAsync(CancellationToken cancellationToken);
}
