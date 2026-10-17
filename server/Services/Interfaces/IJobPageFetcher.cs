namespace server.Services.Interfaces;

public interface IJobPageFetcher
{
    Task<JobPageFetchResult> FetchAsync(string url, CancellationToken cancellationToken);

    /// <summary>Whether the page's response headers let another site show it in an iframe.</summary>
    Task<bool> AllowsFramingAsync(string url, CancellationToken cancellationToken);
}

public sealed record JobPageFetchResult(
    string Url,
    string Text,
    bool Success,
    string? ErrorMessage = null);
