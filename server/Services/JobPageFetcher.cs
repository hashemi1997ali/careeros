using System.Net;
using System.Net.Http.Headers;
using System.Net.Sockets;
using System.Text.RegularExpressions;
using server.Services.Interfaces;

namespace server.Services;

public sealed class JobPageFetcher(HttpClient httpClient, ILogger<JobPageFetcher> logger) : IJobPageFetcher
{
    private const int MaxRedirects = 3;
    private const int MaxResponseCharacters = 1_500_000;
    private const int MaxExtractedCharacters = 25_000;

    public async Task<JobPageFetchResult> FetchAsync(string url, CancellationToken cancellationToken)
    {
        try
        {
            var (response, finalUrl, error) = await GetFollowingRedirectsAsync(url, cancellationToken);
            if (response is null)
            {
                return Failed(url, error!);
            }

            using (response)
            {
                if (!response.IsSuccessStatusCode)
                {
                    return Failed(url, $"The job page returned HTTP {(int)response.StatusCode}.");
                }

                if (response.Content.Headers.ContentLength > MaxResponseCharacters)
                {
                    return Failed(url, "The job page is too large to read safely.");
                }

                var html = await ReadLimitedAsync(response, cancellationToken);
                var text = ExtractReadableText(html);
                if (text.Length < 30)
                {
                    return Failed(url, "The job page did not contain readable job information.");
                }

                return new JobPageFetchResult(finalUrl.ToString(), text, true);
            }
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return Failed(url, "The job page took too long to respond.");
        }
        catch (Exception exception) when (exception is HttpRequestException or IOException or SocketException)
        {
            logger.LogInformation(exception, "Could not fetch job page {Url}", url);
            return Failed(url, "The job page could not be fetched.");
        }
    }

    public async Task<bool> AllowsFramingAsync(string url, CancellationToken cancellationToken)
    {
        try
        {
            var (response, _, _) = await GetFollowingRedirectsAsync(url, cancellationToken);
            if (response is null)
            {
                return false;
            }

            using (response)
            {
                if (!response.IsSuccessStatusCode)
                {
                    return false;
                }

                // Any X-Frame-Options value (DENY, SAMEORIGIN, obsolete ALLOW-FROM) blocks a cross-origin preview.
                if (response.Headers.Contains("X-Frame-Options"))
                {
                    return false;
                }

                // frame-ancestors only allows this app when it is a wildcard; 'none', 'self' or a host list block it.
                var frameAncestors = response.Headers.TryGetValues("Content-Security-Policy", out var policies)
                    ? policies
                        .SelectMany(policy => policy.Split(';'))
                        .Select(directive => directive.Trim())
                        .FirstOrDefault(directive => directive.StartsWith("frame-ancestors", StringComparison.OrdinalIgnoreCase))
                    : null;

                return frameAncestors is null ||
                       frameAncestors.Split(' ', StringSplitOptions.RemoveEmptyEntries).Skip(1).Contains("*");
            }
        }
        catch (Exception exception) when (exception is HttpRequestException or IOException or SocketException or OperationCanceledException && !cancellationToken.IsCancellationRequested)
        {
            logger.LogInformation(exception, "Could not check framing for {Url}", url);
            return false;
        }
    }

    /// <summary>GET with manual redirects, so every hop must pass the public-host check. The caller disposes the response.</summary>
    private async Task<(HttpResponseMessage? Response, Uri FinalUrl, string? Error)> GetFollowingRedirectsAsync(
        string url,
        CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var currentUrl) ||
            (!string.Equals(currentUrl.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
             !string.Equals(currentUrl.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)))
        {
            return (null, new Uri("about:blank"), "The URL must use http or https.");
        }

        for (var redirect = 0; redirect <= MaxRedirects; redirect++)
        {
            if (!await IsPublicHttpHostAsync(currentUrl, cancellationToken))
            {
                return (null, currentUrl, "The URL points to a private or local host.");
            }

            var response = await httpClient.GetAsync(currentUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            if ((int)response.StatusCode is >= 300 and < 400 && response.Headers.Location is not null)
            {
                var next = new Uri(currentUrl, response.Headers.Location);
                response.Dispose();
                if (redirect == MaxRedirects)
                {
                    return (null, currentUrl, "The page redirected too many times.");
                }

                currentUrl = next;
                continue;
            }

            return (response, currentUrl, null);
        }

        return (null, currentUrl, "The page could not be fetched.");
    }

    private static async Task<string> ReadLimitedAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(stream);
        var buffer = new char[8192];
        var content = new System.Text.StringBuilder();

        while (content.Length < MaxResponseCharacters)
        {
            var count = await reader.ReadAsync(buffer.AsMemory(0, Math.Min(buffer.Length, MaxResponseCharacters - content.Length)), cancellationToken);
            if (count == 0)
            {
                break;
            }

            content.Append(buffer, 0, count);
        }

        return content.ToString();
    }

    private static string ExtractReadableText(string html)
    {
        var structuredData = Regex.Matches(
                html,
                "<script[^>]+type\\s*=\\s*[\\\"']application/ld\\+json[\\\"'][^>]*>(.*?)</script>",
                RegexOptions.IgnoreCase | RegexOptions.Singleline)
            .Select(match => match.Groups[1].Value);
        var withoutNonContent = Regex.Replace(html, @"<(script|style|noscript|svg|template)[^>]*>.*?</\1>", " ", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        var withoutTags = Regex.Replace(withoutNonContent, "<[^>]+>", " ");
        var decoded = WebUtility.HtmlDecode(withoutTags);
        var normalized = Regex.Replace(
                string.Join(" ", new[] { decoded }.Concat(structuredData)),
                @"\s+",
                " ")
            .Trim();
        return normalized.Length <= MaxExtractedCharacters
            ? normalized
            : normalized[..MaxExtractedCharacters];
    }

    private static async Task<bool> IsPublicHttpHostAsync(Uri uri, CancellationToken cancellationToken)
    {
        if (uri.UserInfo.Length > 0 || uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (IPAddress.TryParse(uri.Host, out var address))
        {
            return IsPublicAddress(address);
        }

        var addresses = await Dns.GetHostAddressesAsync(uri.Host, cancellationToken);
        return addresses.Length > 0 && addresses.All(IsPublicAddress);
    }

    private static bool IsPublicAddress(IPAddress address)
    {
        if (address.IsIPv4MappedToIPv6)
        {
            address = address.MapToIPv4();
        }

        if (IPAddress.IsLoopback(address) || address.Equals(IPAddress.Any) || address.Equals(IPAddress.IPv6Any))
        {
            return false;
        }

        if (address.AddressFamily == AddressFamily.InterNetwork)
        {
            var bytes = address.GetAddressBytes();
            return bytes[0] is not 0 and not 10 and not 127 &&
                   !(bytes[0] == 169 && bytes[1] == 254) &&
                   !(bytes[0] == 172 && bytes[1] is >= 16 and <= 31) &&
                   !(bytes[0] == 192 && bytes[1] == 168) &&
                   !(bytes[0] == 100 && bytes[1] is >= 64 and <= 127);
        }

        return !address.IsIPv6LinkLocal && !address.IsIPv6SiteLocal && !address.IsIPv6UniqueLocal && !address.IsIPv6Multicast;
    }

    private static JobPageFetchResult Failed(string url, string message) => new(url, string.Empty, false, message);
}
