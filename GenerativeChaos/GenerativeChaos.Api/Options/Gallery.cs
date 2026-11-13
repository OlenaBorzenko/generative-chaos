namespace GenerativeChaos.Api.Options;

public record Gallery
{
    public required string CacheSimilarityScore { get; init; }

    public required string DesignsMaxResults { get; init; }

    public double MinRelatedSimilarityScore { get; init; } = 0.6;
}