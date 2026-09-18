namespace server.Services.Interfaces;

public interface ICurrentUserService
{
    Task<Guid> GetRequiredUserIdAsync(CancellationToken cancellationToken);
}
