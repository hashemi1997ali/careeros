using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace server.Services;

public class OidcDocument
{
    [JsonPropertyName("issuer")]
    public string Issuer { get; set; } = string.Empty;

    [JsonPropertyName("userinfo_endpoint")]
    public string UserInfoEndpoint { get; set; } = string.Empty;
}

public class OidcDiscovery
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _authority;
    private readonly SemaphoreSlim _gate = new(1, 1);

    private OidcDocument? _cached;

    public OidcDiscovery(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;

        var authority = configuration["Oidc:Issuer"]
            ?? throw new InvalidOperationException("Oidc:Issuer is not configured");

        _authority = authority.EndsWith('/') ? authority : authority + "/";
    }

    public async Task<OidcDocument> GetAsync(CancellationToken cancellationToken = default)
    {
        if (_cached is not null) return _cached;

        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (_cached is not null) return _cached;

            var url = new Uri(new Uri(_authority), ".well-known/openid-configuration");

            var http = _httpClientFactory.CreateClient();

            var document = await http.GetFromJsonAsync<OidcDocument>(url, cancellationToken)
                ?? throw new InvalidOperationException($"Empty discovery document at {url}");

            _cached = document;
            return document;
        }
        finally
        {
            _gate.Release();
        }
    }
}
