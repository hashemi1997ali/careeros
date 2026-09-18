using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services.Interfaces;

namespace server.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<DashboardResponseDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardResponseDto>> GetDashboard(
        CancellationToken cancellationToken)
    {
        return Ok(await dashboardService.GetAsync(cancellationToken));
    }
}
