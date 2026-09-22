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
        if (!Uri.TryCreate(url, UriKind.Absolute, out var currentUrl) ||
            (!string.Equals(currentUrl.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
             !string.Equals(currentUrl.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)))
        {
            return Failed(url, "The job URL must use http or https.");
        }

        try
        {
            for (var redirect = 0; redirect <= MaxRedirects; redirect++)
            {
                if (!await IsPublicHttpHostAsync(currentUrl, cancellationToken))
                {
                    return Failed(url, "The job URL points to a private or local host.");
                }

                using var response = await httpClient.GetAsync(
                    currentUrl,
                    HttpCompletionOption.ResponseHeadersRead,
                    cancellationToken);

                if ((int)response.StatusCode is >= 300 and < 400 && response.Headers.Location is not null)
                {
                    if (redirect == MaxRedirects)
                    {
                        return Failed(url, "The job page redirected too many times.");
                    }

                    currentUrl = new Uri(currentUrl, response.Headers.Location);
                    continue;
                }

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

                return new JobPageFetchResult(currentUrl.ToString(), text, true);
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

        return Failed(url, "The job page could not be fetched.");
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
        if (IPAddress.IsLoopback(address) || address.Equals(IPAddress.Any) || address.Equals(IPAddress.IPv6Any))
        {
            return false;
        }

        if (address.AddressFamily == AddressFamily.InterNetwork)
        {
            var bytes = address.GetAddressBytes();
            return bytes[0] is not 10 and not 127 &&
                   !(bytes[0] == 169 && bytes[1] == 254) &&
                   !(bytes[0] == 172 && bytes[1] is >= 16 and <= 31) &&
                   !(bytes[0] == 192 && bytes[1] == 168) &&
                   !(bytes[0] == 100 && bytes[1] is >= 64 and <= 127);
        }

        return !address.IsIPv6LinkLocal && !address.IsIPv6SiteLocal && !address.IsIPv6Multicast;
    }

    private static JobPageFetchResult Failed(string url, string message) => new(url, string.Empty, false, message);
}
