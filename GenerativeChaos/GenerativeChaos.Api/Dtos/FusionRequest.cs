namespace GenerativeChaos.Api.Dtos;

public record FusionRequest
{
    public required string NewDesignId { get; set; }

    public required List<string> SimilarDesignIds { get; set; }

    public string? Guidance { get; set; }
}
