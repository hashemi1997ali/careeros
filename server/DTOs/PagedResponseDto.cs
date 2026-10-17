using System.ComponentModel.DataAnnotations;

namespace server.DTOs;

/// <summary>Query string for paged list endpoints. Without <see cref="Page"/> the endpoints return the full list.</summary>
public sealed class PageQueryDto
{
    [Range(1, 100_000)]
    public int? Page { get; set; }

    [Range(1, 100)]
    public int PageSize { get; set; } = 20;

    /// <summary>Endpoint-specific sort key; unknown keys fall back to the default order.</summary>
    [StringLength(32)]
    public string? Sort { get; set; }
}

public sealed class PagedResponseDto<T>
{
    public required IReadOnlyList<T> Items { get; init; }

    /// <summary>Items matching the search and filter, across all pages.</summary>
    public required int Total { get; init; }

    public required int Page { get; init; }

    public required int PageSize { get; init; }

    /// <summary>Counts per filter option over all of the user's items (ignoring search and filter), for the filter chips.</summary>
    public required IReadOnlyDictionary<string, int> Facets { get; init; }
}
