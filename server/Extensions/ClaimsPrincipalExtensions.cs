using System.Security.Claims;

namespace server.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string? Sub(this ClaimsPrincipal principal) =>
        principal.FindFirst("sub")?.Value
        ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
}
