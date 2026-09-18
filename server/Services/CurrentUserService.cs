using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Exceptions;
using server.Extensions;
using server.Services.Interfaces;

namespace server.Services;

public class CurrentUserService(
    IHttpContextAccessor httpContextAccessor,
    AppDbContext context) : ICurrentUserService
{
    private Guid? _userId;

    public async Task<Guid> GetRequiredUserIdAsync(CancellationToken cancellationToken)
    {
        if (_userId.HasValue)
        {
            return _userId.Value;
        }

        var principal = httpContextAccessor.HttpContext?.User;
        var subject = principal?.Sub();

        if (principal?.Identity?.IsAuthenticated != true || string.IsNullOrWhiteSpace(subject))
        {
            throw new UserNotProvisionedException("The request does not contain an authenticated user.");
        }

        _userId = await context.Users
            .AsNoTracking()
            .Where(user => user.AuthSub == subject)
            .Select(user => (Guid?)user.Id)
            .SingleOrDefaultAsync(cancellationToken);

        if (!_userId.HasValue)
        {
            throw new UserNotProvisionedException(
                "The authenticated user has not been provisioned. Sign in again to synchronize the account.");
        }

        return _userId.Value;
    }
}
