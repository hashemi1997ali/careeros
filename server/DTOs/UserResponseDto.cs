using server.Models;

namespace server.DTOs;

public record UserResponseDto(
    Guid Id,
    string AuthSub,
    string? Email,
    string? DisplayName,
    string? PictureUrl,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastLoginAt)
{
    public static UserResponseDto From(User user) => new(
        user.Id,
        user.AuthSub,
        user.Email,
        user.DisplayName,
        user.PictureUrl,
        user.CreatedAt,
        user.LastLoginAt);
}

public record SyncUserResponseDto(UserResponseDto User);
