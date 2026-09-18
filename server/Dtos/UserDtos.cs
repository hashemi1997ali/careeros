using server.Models;

namespace server.Dtos;

public record UserDto(
    Guid Id,
    string AuthSub,
    string? Email,
    string? DisplayName,
    string? PictureUrl,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastLoginAt)
{
    public static UserDto From(User user) => new(
        user.Id,
        user.AuthSub,
        user.Email,
        user.DisplayName,
        user.PictureUrl,
        user.CreatedAt,
        user.LastLoginAt);
}

public record SyncResponse(UserDto User);
