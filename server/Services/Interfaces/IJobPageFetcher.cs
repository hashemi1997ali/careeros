namespace server.Services.Interfaces;

public interface IJobPageFetcher
{
    Task<JobPageFetchResult> FetchAsync(string url, CancellationToken cancellationToken);
}

public sealed record JobPageFetchResult(
    string Url,
    string Text,
    bool Success,
    string? ErrorMessage = null);
