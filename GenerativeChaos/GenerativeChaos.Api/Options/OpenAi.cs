namespace GenerativeChaos.Api.Options;

public record OpenAi
{
    public required string Endpoint { get; init; }

    public required string CompletionDeploymentName { get; init; }

    public required string EmbeddingDeploymentName { get; init; }

    // Optional settings. All null/absent => behavior identical to before.

    /// <summary>Deployment used for design fusion. Falls back to CompletionDeploymentName when empty.</summary>
    public string? FusionDeploymentName { get; init; }

    /// <summary>Omitted for reasoning models (o-series, gpt-5*).</summary>
    public double? Temperature { get; init; }

    /// <summary>Omitted for reasoning models (o-series, gpt-5*).</summary>
    public double? TopP { get; init; }

    public int? MaxOutputTokens { get; init; }

    /// <summary>"minimal" | "low" | "medium" | "high". Setting it marks the deployment as a reasoning model.</summary>
    public string? ReasoningEffort { get; init; }

    /// <summary>When true, JSON-producing calls request response_format json_object.</summary>
    public bool? UseStructuredOutput { get; init; }
}
