using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace server.Controllers;

[ApiController]
[Route("health")]
public class HealthController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public HealthController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [AllowAnonymous]
    [HttpGet]
    public IActionResult Get() => Ok(new
    {
        ok = true,
        service = "careeros-api",
        environment = _environment.EnvironmentName,
    });
}
