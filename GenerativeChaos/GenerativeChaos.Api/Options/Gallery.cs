namespace GenerativeChaos.Api.Options;

public record Gallery
{
    public required string CacheSimilarityScore { get; init; }

    public required string DesignsMaxResults { get; init; }
}