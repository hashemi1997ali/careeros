using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;

namespace server.Services;

public class UserInfo
{
    [JsonPropertyName("sub")]
    public string Sub { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("nickname")]
    public string? Nickname { get; set; }

    [JsonPropertyName("picture")]
    public string? Picture { get; set; }
}

public class UserProvisioningService
{
    private readonly AppDbContext _context;
    private readonly OidcDiscovery _discovery;
    private readonly HttpClient _http;

    public UserProvisioningService(AppDbContext context, OidcDiscovery discovery, HttpClient http)
    {
        _context = context;
        _discovery = discovery;
        _http = http;
    }

    public async Task<UserInfo> FetchUserInfoAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        var document = await _discovery.GetAsync(cancellationToken);

        using var request = new HttpRequestMessage(HttpMethod.Get, document.UserInfoEndpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _http.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException(
                $"userinfo returned {(int)response.StatusCode}: {body}");
        }

        return await response.Content.ReadFromJsonAsync<UserInfo>(cancellationToken)
            ?? throw new HttpRequestException("userinfo returned an empty body");
    }

    public async Task<User> UpsertAsync(UserInfo info, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.AuthSub == info.Sub, cancellationToken);

        if (user is null)
        {
            user = new User { AuthSub = info.Sub };
            _context.Users.Add(user);
        }

        user.Email = info.Email;
        user.DisplayName = info.Name ?? info.Nickname ?? info.Email;
        user.PictureUrl = info.Picture;
        user.LastLoginAt = DateTimeOffset.UtcNow;

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            _context.ChangeTracker.Clear();

            var existing = await _context.Users
                .FirstOrDefaultAsync(u => u.AuthSub == info.Sub, cancellationToken);

            if (existing is null) throw;

            return existing;
        }

        return user;
    }
}
