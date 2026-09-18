using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Exceptions;
using server.Extensions;
using server.Services;

namespace server.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserProvisioningService _provisioning;

    public UsersController(AppDbContext context, UserProvisioningService provisioning)
    {
        _context = context;
        _provisioning = provisioning;
    }

    [HttpPost("sync")]
    public async Task<ActionResult<SyncUserResponseDto>> Sync(CancellationToken cancellationToken)
    {
        var token = await HttpContext.GetTokenAsync("access_token");

        if (string.IsNullOrEmpty(token))
        {
            return Problem(
                detail: "The bearer token was not retained; set SaveToken = true in the JWT options.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        var info = await _provisioning.FetchUserInfoAsync(token, cancellationToken);

        if (!string.IsNullOrEmpty(HttpContext.User.Sub()) && info.Sub != HttpContext.User.Sub())
        {
            throw new IdentityProviderException(
                "The token subject did not match the userinfo subject.");
        }

        var user = await _provisioning.UpsertAsync(info, cancellationToken);

        return Ok(new SyncUserResponseDto(UserResponseDto.From(user)));
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserResponseDto>> Me(CancellationToken cancellationToken)
    {
        var sub = HttpContext.User.Sub();

        if (string.IsNullOrEmpty(sub)) return Unauthorized();

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.AuthSub == sub, cancellationToken);

        if (user is null) return NotFound(new { error = "user_not_provisioned" });

        return Ok(UserResponseDto.From(user));
    }

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMe(CancellationToken cancellationToken)
    {
        var sub = HttpContext.User.Sub();

        if (string.IsNullOrEmpty(sub)) return Unauthorized();

        var user = await _context.Users
            .FirstOrDefaultAsync(item => item.AuthSub == sub, cancellationToken);

        if (user is null) return NotFound(new { error = "user_not_provisioned" });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
